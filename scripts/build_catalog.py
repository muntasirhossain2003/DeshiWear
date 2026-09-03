#!/usr/bin/env python3
"""Turn the crawler's research images into the storefront's seed catalog.

Reads `data/aarong/catalog.json` (produced by `crawl_aarong.py`), then:

  1. Downscales every photograph to a web-sized WebP under
     `frontend/public/products/<type>/NN.webp`.
  2. Samples each photograph for its dominant garment colour and snaps that to
     the named palette the storefront's colour filter offers, so filtering by
     "Maroon" actually returns maroon things.
  3. Writes `backend/data/products.js` by pairing those images with the
     editorial copy in `catalog_copy.py`.

The raw `data/` folder stays out of git; this script is how it becomes shippable
assets. Re-runnable: output is deterministic, so a second run is a no-op diff.

    python3 scripts/build_catalog.py
    python3 scripts/build_catalog.py --width 1000 --quality 80
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover - dependency hint
    sys.exit("Pillow is required: pip install Pillow")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from catalog_copy import PRODUCTS, SIZES, SKU_PREFIX, TAGS, TYPE_MAP  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
CATALOG = REPO / "data" / "aarong" / "catalog.json"
IMAGE_OUT = REPO / "frontend" / "public" / "products"
SEED_OUT = REPO / "backend" / "data" / "products.js"
FACETS_OUT = REPO / "frontend" / "src" / "data" / "catalogFacets.js"

# Size tokens in the order a shopper expects to see them, smallest first.
SIZE_ORDER = [
    "0-3M", "3-6M", "6-12M", "12-18M",
    "2Y", "3Y", "4Y", "5Y", "6Y", "7Y", "8Y", "9Y", "10Y", "12Y", "14Y", "15Y",
    "S", "M", "L", "XL", "XXL", "Free Size",
]

# Photographs below this pixel count are placeholders rather than product shots
# (Aarong serves a 262x262 "no image" tile for withdrawn SKUs).
MIN_PIXELS = 400 * 400

IMAGES_PER_PRODUCT = 2


# --------------------------------------------------------------------------
# Colour naming
# --------------------------------------------------------------------------

# The palette the storefront filters on. Each name carries several sRGB
# anchors spanning the lightness range it covers, because a single anchor
# makes matching fail at the extremes — one mid-grey anchor leaves a dark
# neutral closer to Brown than to Grey.
PALETTE = {
    "White": [(245, 244, 240), (232, 232, 234), (250, 250, 248)],
    "Cream": [(238, 228, 205), (228, 216, 192)],
    "Beige": [(206, 190, 164), (186, 168, 142), (168, 152, 128)],
    "Grey": [(196, 196, 198), (160, 158, 162), (124, 122, 126), (100, 98, 103), (78, 76, 81)],
    "Black": [(44, 42, 46), (26, 25, 28)],
    "Red": [(196, 44, 44), (166, 38, 40), (216, 76, 66)],
    "Maroon": [(114, 34, 44), (92, 30, 40), (136, 46, 58)],
    "Pink": [(226, 138, 165), (238, 178, 194), (206, 104, 138)],
    "Orange": [(222, 118, 47), (236, 148, 78)],
    "Yellow": [(226, 189, 74), (240, 214, 116)],
    "Gold": [(186, 148, 62), (204, 172, 96)],
    "Green": [(58, 122, 78), (40, 92, 58), (96, 148, 92)],
    "Mint": [(162, 208, 186), (196, 224, 208)],
    "Teal": [(44, 122, 126), (32, 96, 104), (78, 148, 150)],
    "Blue": [(54, 96, 168), (72, 126, 190), (40, 78, 140)],
    "Navy": [(38, 52, 92), (28, 38, 68)],
    "Purple": [(114, 74, 142), (146, 108, 170)],
    "Brown": [(118, 84, 60), (94, 68, 48), (146, 110, 80)],
}

# Names that describe an absence of hue. A near-neutral sample is only ever
# matched against these, so a desaturated charcoal can never land on Brown.
NEUTRALS = {"White", "Cream", "Beige", "Grey", "Black"}

# Below this HSV saturation a sample counts as neutral.
NEUTRAL_SATURATION = 0.16


def _srgb_to_lab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """Convert 8-bit sRGB to CIELAB under a D65 white point."""

    def linear(c: float) -> float:
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (linear(c) for c in rgb)
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 1.00000
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883

    def f(t: float) -> float:
        return t ** (1 / 3) if t > 0.008856 else (7.787 * t) + (16 / 116)

    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy) - 16, 500 * (fx - fy), 200 * (fy - fz)


PALETTE_LAB = {
    name: [_srgb_to_lab(rgb) for rgb in anchors] for name, anchors in PALETTE.items()
}


def nearest_colour(rgb: tuple[int, int, int]) -> str:
    """Name the closest palette colour to `rgb` by CIELAB distance.

    Near-neutral samples are matched only against the neutral names; without
    that gate a desaturated dark grey scores closer to a saturated brown
    anchor on lightness alone.
    """
    lab = _srgb_to_lab(rgb)
    _, saturation, _ = _hsv(rgb)
    candidates = NEUTRALS if saturation < NEUTRAL_SATURATION else PALETTE_LAB.keys()

    def distance(name: str) -> float:
        return min(
            sum((a - b) ** 2 for a, b in zip(lab, anchor)) for anchor in PALETTE_LAB[name]
        )

    return min(candidates, key=distance)


def _lab_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    la, lb = _srgb_to_lab(a), _srgb_to_lab(b)
    return sum((x - y) ** 2 for x, y in zip(la, lb)) ** 0.5


# A cluster within this CIELAB distance of the sampled backdrop is the backdrop.
BACKDROP_TOLERANCE = 14.0

# Skin reads as a mid-tone orange-brown. Excluding that band stops a model's
# arms from being reported as the garment's colour.
SKIN_HUE = (14, 40)
SKIN_SAT = (0.16, 0.62)
SKIN_VAL = (0.32, 0.94)


def _hsv(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    r, g, b = (c / 255 for c in rgb)
    high, low = max(r, g, b), min(r, g, b)
    span = high - low
    if span == 0:
        hue = 0.0
    elif high == r:
        hue = (60 * ((g - b) / span)) % 360
    elif high == g:
        hue = 60 * ((b - r) / span) + 120
    else:
        hue = 60 * ((r - g) / span) + 240
    return hue, (span / high if high else 0.0), high


def _is_skin(rgb: tuple[int, int, int]) -> bool:
    hue, sat, val = _hsv(rgb)
    return (
        SKIN_HUE[0] <= hue <= SKIN_HUE[1]
        and SKIN_SAT[0] <= sat <= SKIN_SAT[1]
        and SKIN_VAL[0] <= val <= SKIN_VAL[1]
    )


def _backdrop(image: Image.Image) -> tuple[int, int, int]:
    """Estimate the studio sweep colour from the image corners.

    The corners of a catalogue shot are backdrop by construction, so this is a
    far more reliable reference than assuming the sweep is pure white — Aarong
    shoots on white, light grey and warm bone depending on the line.
    """
    w, h = image.size
    box = max(8, min(w, h) // 12)
    patches = [
        (0, 0, box, box),
        (w - box, 0, w, box),
        (0, h - box, box, h),
        (w - box, h - box, w, h),
    ]
    samples = []
    for patch in patches:
        region = image.crop(patch).resize((1, 1), Image.Resampling.BILINEAR)
        samples.append(region.getpixel((0, 0)))
    return tuple(round(sum(c[i] for c in samples) / len(samples)) for i in range(3))


def garment_colours(image: Image.Image, count: int = 2) -> list[str]:
    """Sample the garment — not the sweep, not the model — and name its colours.

    Clusters close to the corner-sampled backdrop are dropped, as is the skin
    band. If that leaves nothing, the garment genuinely matches the backdrop
    (a white panjabi on a white sweep), so the backdrop colour is the answer.
    """
    backdrop = _backdrop(image)

    w, h = image.size
    centre = image.crop((int(w * 0.30), int(h * 0.28), int(w * 0.70), int(h * 0.82)))
    centre = centre.resize((90, 90), Image.Resampling.BILINEAR)

    quantised = centre.quantize(colors=16, method=Image.Quantize.FASTOCTREE)
    palette = quantised.getpalette() or []
    counts = Counter(quantised.getdata())

    # Accumulate weight per palette *name*, not per quantiser bin. A single
    # flat garment colour is routinely split across several near-identical
    # bins, so ranking raw bins lets a small patch of contrast embroidery
    # outrank the body of the garment.
    weights: Counter[str] = Counter()
    for index, freq in counts.most_common():
        rgb = tuple(palette[index * 3 : index * 3 + 3])
        if len(rgb) < 3:
            continue
        if _lab_distance(rgb, backdrop) < BACKDROP_TOLERANCE:
            continue
        if _is_skin(rgb):
            continue
        weights[nearest_colour(rgb)] += freq

    if not weights:
        return [nearest_colour(backdrop)]

    # Ignore slivers: under 8% of the sampled garment is trim, not its colour.
    floor = sum(weights.values()) * 0.08
    ranked = [name for name, weight in weights.most_common() if weight >= floor]
    return (ranked or [weights.most_common(1)[0][0]])[:count]


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-")


def js_string(value: str) -> str:
    """Emit a double-quoted JS string literal."""
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def js_array(values) -> str:
    return "[" + ", ".join(js_string(v) for v in values) + "]"


def build_images(records, width: int, quality: int, verbose: bool):
    """Downscale each usable photograph and return per-type image metadata."""
    by_type: dict[str, list[dict]] = {}
    skipped: list[str] = []

    for record in records:
        product_type = record["product_type"]
        source = Path(record["local_path"])
        if not source.is_absolute():
            source = REPO / source
        if not source.exists():
            skipped.append(f"{product_type}: missing {source.name}")
            continue

        with Image.open(source) as im:
            im = im.convert("RGB")
            if im.width * im.height < MIN_PIXELS:
                skipped.append(f"{product_type}: {source.name} is a {im.width}x{im.height} placeholder")
                continue

            colours = garment_colours(im)

            type_slug = slugify(product_type)
            out_dir = IMAGE_OUT / type_slug
            out_dir.mkdir(parents=True, exist_ok=True)

            index = len(by_type.get(product_type, [])) + 1
            out_path = out_dir / f"{index:02d}.webp"

            if im.width > width:
                height = round(im.height * width / im.width)
                im = im.resize((width, height), Image.Resampling.LANCZOS)
            im.save(out_path, "WEBP", quality=quality, method=6)

        by_type.setdefault(product_type, []).append(
            {
                "url": f"/products/{type_slug}/{out_path.name}",
                "colours": colours,
                "source": record["image_url"],
            }
        )
        if verbose:
            print(f"  {out_path.relative_to(REPO)}  {', '.join(colours)}")

    return by_type, skipped


def build_products(by_type: dict[str, list[dict]]) -> list[dict]:
    """Pair photographs with editorial copy into seed product records."""
    products: list[dict] = []

    for product_type in sorted(by_type, key=lambda t: list(TYPE_MAP).index(t)):
        images = by_type[product_type]
        category, collection, gender = TYPE_MAP[product_type]
        copy = PRODUCTS[product_type]
        prefix = SKU_PREFIX[product_type]

        for slot, (name, material, price, discount, description) in enumerate(copy):
            chunk = images[slot * IMAGES_PER_PRODUCT : (slot + 1) * IMAGES_PER_PRODUCT]
            if not chunk:
                continue

            colours: list[str] = []
            for image in chunk:
                for colour in image["colours"]:
                    if colour not in colours:
                        colours.append(colour)

            products.append(
                {
                    "name": name,
                    "description": description,
                    "price": price,
                    "discountPrice": discount,
                    # Deterministic spread so reruns produce no diff.
                    "countInStock": 12 + (slot * 7 + len(name)) % 40,
                    "sku": f"{prefix}-{slot + 1:03d}",
                    "category": category,
                    "collections": collection,
                    "sizes": SIZES[product_type],
                    "colors": colours[:3],
                    "material": material,
                    "gender": gender,
                    "images": [{"url": i["url"], "altText": name} for i in chunk],
                    # One flagship per type; the endpoint serves the first four.
                    "isFeatured": slot == 0 and discount is not None,
                    "tags": TAGS[product_type],
                    "rating": round(4.0 + ((slot * 13 + len(name)) % 10) / 10, 1),
                    "numReviews": 6 + (slot * 17 + len(name)) % 60,
                }
            )

    return products


def render_seed(products: list[dict]) -> str:
    lines = [
        "// DeshiWear seed catalog — prices in BDT (৳).",
        "//",
        "// Generated by scripts/build_catalog.py. Photography lives in",
        "// frontend/public/products/ and is served by Vite as a static asset.",
        "// Edit the copy in scripts/catalog_copy.py and re-run the builder",
        "// rather than editing this file by hand.",
        "",
        "const products = [",
    ]

    for product in products:
        lines.append("  {")
        lines.append(f"    name: {js_string(product['name'])},")
        lines.append(f"    description:\n      {js_string(product['description'])},")
        lines.append(f"    price: {product['price']},")
        if product["discountPrice"] is not None:
            lines.append(f"    discountPrice: {product['discountPrice']},")
        lines.append(f"    countInStock: {product['countInStock']},")
        lines.append(f"    sku: {js_string(product['sku'])},")
        lines.append(f"    category: {js_string(product['category'])},")
        lines.append(f"    collections: {js_string(product['collections'])},")
        lines.append(f"    sizes: {js_array(product['sizes'])},")
        lines.append(f"    colors: {js_array(product['colors'])},")
        lines.append(f"    material: {js_string(product['material'])},")
        lines.append(f"    gender: {js_string(product['gender'])},")
        lines.append("    images: [")
        for image in product["images"]:
            lines.append(
                f"      {{ url: {js_string(image['url'])}, altText: {js_string(image['altText'])} }},"
            )
        lines.append("    ],")
        if product["isFeatured"]:
            lines.append("    isFeatured: true,")
        lines.append(f"    tags: {js_array(product['tags'])},")
        lines.append(f"    rating: {product['rating']},")
        lines.append(f"    numReviews: {product['numReviews']},")
        lines.append("  },")

    lines.append("];")
    lines.append("")
    lines.append("export default products;")
    lines.append("")
    return "\n".join(lines)


def render_facets(products: list[dict]) -> str:
    """Emit the filter facets the storefront sidebar offers.

    Generated from the seeded products themselves, so the sidebar can only ever
    offer a filter that has something behind it. Hand-maintaining these lists is
    how the catalogue previously ended up advertising seven empty categories.
    """
    category_order = [category for category, _, _ in TYPE_MAP.values()]
    categories = sorted(
        {p["category"] for p in products}, key=lambda c: category_order.index(c)
    )
    collections = sorted({p["collections"] for p in products})
    genders = sorted({p["gender"] for p in products})

    # The catalogue names ~40 distinct materials; a sidebar cannot show them all
    # legibly, so offer the best-stocked dozen and sort those alphabetically.
    material_counts = Counter(p["material"] for p in products)
    materials = sorted(name for name, _ in material_counts.most_common(12))

    used_colours = {c for p in products for c in p["colors"]}
    colours = [name for name in PALETTE if name in used_colours]

    used_sizes = {s for p in products for s in p["sizes"]}
    sizes = [s for s in SIZE_ORDER if s in used_sizes]

    # Round the slider ceiling up to the next 1000 so the priciest item is reachable.
    ceiling = max(p["price"] for p in products)
    max_price = -(-ceiling // 1000) * 1000

    # Swatch uses the middle anchor of each name's range — the lightest anchor
    # of a wide range like Grey reads as near-white in a 28px circle.
    def swatch(name: str) -> str:
        anchors = PALETTE[name]
        return "#%02x%02x%02x" % anchors[len(anchors) // 2]

    swatches = "\n".join(
        f"  {js_string(name)}: {js_string(swatch(name))}," for name in colours
    )

    return f"""// Filter facets for the storefront sidebar.
//
// Generated by scripts/build_catalog.py from the seeded catalog — every option
// here has products behind it. Do not edit by hand; re-run the builder.

export const categories = {js_array(categories)};

export const collections = {js_array(collections)};

export const genders = {js_array(genders)};

export const materials = {js_array(materials)};

export const sizes = {js_array(sizes)};

export const colors = {js_array(colours)};

// Swatch fill per colour name, matched to the anchors the builder samples against.
export const colorSwatches = {{
{swatches}
}};

export const maxPrice = {max_price};
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--width", type=int, default=800, help="max output width in px (default: 800)")
    parser.add_argument("--quality", type=int, default=80, help="WebP quality 1-100 (default: 80)")
    parser.add_argument("--verbose", action="store_true", help="print every image written")
    args = parser.parse_args()

    if not CATALOG.exists():
        sys.exit(f"{CATALOG.relative_to(REPO)} not found — run scripts/crawl_aarong.py first")

    records = json.loads(CATALOG.read_text())["products"]
    unknown = sorted({r["product_type"] for r in records} - set(TYPE_MAP))
    if unknown:
        sys.exit(f"No storefront mapping for product types: {', '.join(unknown)}")

    print(f"Processing {len(records)} images at {args.width}px WebP q{args.quality}...")
    by_type, skipped = build_images(records, args.width, args.quality, args.verbose)

    products = build_products(by_type)
    SEED_OUT.write_text(render_seed(products))
    FACETS_OUT.parent.mkdir(parents=True, exist_ok=True)
    FACETS_OUT.write_text(render_facets(products))

    written = sum(len(v) for v in by_type.values())
    total_bytes = sum(p.stat().st_size for p in IMAGE_OUT.rglob("*.webp"))
    print(f"Wrote {written} images to {IMAGE_OUT.relative_to(REPO)} ({total_bytes / 1e6:.1f} MB)")
    print(f"Wrote {len(products)} products to {SEED_OUT.relative_to(REPO)}")
    print(f"Wrote filter facets to {FACETS_OUT.relative_to(REPO)}")

    by_category = Counter(p["category"] for p in products)
    for category, count in sorted(by_category.items()):
        print(f"  {category:<16} {count}")

    for note in skipped:
        print(f"skipped — {note}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
