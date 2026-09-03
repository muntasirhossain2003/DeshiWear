#!/usr/bin/env python3
"""Collect a small, attributed Aarong image dataset by DeshiWear product type.

The crawler uses Aarong's public Magento GraphQL catalog when it is available.
It also understands server-rendered product-card markup as a fallback. It does
not treat campaign banners or department thumbnails as product images.

Run ``python3 scripts/crawl_aarong.py --help`` for usage.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import mimetypes
import re
import time
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser


BASE_URL = "https://www.aarong.com"
GRAPHQL_URL = "https://mcprod.aarong.com/graphql"
STORE_CODE = "bgd"
USER_AGENT = "DeshiWearCatalogResearch/1.0 (+local development image research)"
DEFAULT_CONFIG = Path(__file__).with_name("aarong_categories.json")
DEFAULT_INDEXED_IMAGES = Path(__file__).with_name("aarong_indexed_images.json")
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "aarong"
PRODUCT_MEDIA_MARKER = "/media/catalog/product/"
IMAGE_MIME_EXTENSIONS = {
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class CrawlError(RuntimeError):
    """An expected crawl or validation failure."""


@dataclass(frozen=True)
class ImageRecord:
    product_type: str
    product_name: str
    sku: str
    product_url: str
    source_page: str
    image_url: str
    alt_text: str = ""
    local_path: str = ""


class ProductMarkupParser(HTMLParser):
    """Extract catalog-product images and the enclosing link from HTML."""

    def __init__(self, page_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.page_url = page_url
        self._anchor_stack: list[dict[str, Any]] = []
        self.records: list[tuple[str, str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key: value or "" for key, value in attrs}
        if tag == "a":
            self._anchor_stack.append(
                {"href": urljoin(self.page_url, attributes.get("href", "")), "text": []}
            )
            return

        if tag != "img":
            return

        candidates = [attributes.get("src", "")]
        srcset = attributes.get("srcset", "")
        candidates.extend(part.strip().split(" ", 1)[0] for part in srcset.split(","))
        image_url = next(
            (
                urljoin(self.page_url, value.replace("&amp;", "&"))
                for value in reversed(candidates)
                if PRODUCT_MEDIA_MARKER in value
            ),
            "",
        )
        if not image_url:
            return

        anchor = self._anchor_stack[-1] if self._anchor_stack else {"href": self.page_url}
        self.records.append(
            (image_url, anchor.get("href", self.page_url), attributes.get("alt", ""))
        )

    def handle_data(self, data: str) -> None:
        if self._anchor_stack:
            self._anchor_stack[-1]["text"].append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._anchor_stack:
            self._anchor_stack.pop()


class Fetcher:
    """Rate-limited HTTP client with retries and per-origin robots checks."""

    def __init__(self, delay: float, timeout: float, retries: int) -> None:
        self.delay = delay
        self.timeout = timeout
        self.retries = retries
        self._last_request = 0.0
        self._robots: dict[str, RobotFileParser | bool] = {}

    @staticmethod
    def _origin(url: str) -> str:
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"

    def _wait(self) -> None:
        remaining = self.delay - (time.monotonic() - self._last_request)
        if remaining > 0:
            time.sleep(remaining)

    def _request(self, url: str, *, data: bytes | None = None, headers: dict[str, str] | None = None) -> tuple[bytes, str]:
        request_headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
        request_headers.update(headers or {})
        last_error: Exception | None = None

        for attempt in range(self.retries + 1):
            self._wait()
            request = Request(url, data=data, headers=request_headers)
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    body = response.read()
                    content_type = response.headers.get_content_type()
                self._last_request = time.monotonic()
                return body, content_type
            except HTTPError as error:
                self._last_request = time.monotonic()
                last_error = error
                if error.code not in {429, 500, 502, 503, 504} or attempt >= self.retries:
                    break
                retry_after = error.headers.get("Retry-After", "")
                wait_for = float(retry_after) if retry_after.isdigit() else 2**attempt
                time.sleep(min(wait_for, 30.0))
            except URLError as error:
                self._last_request = time.monotonic()
                last_error = error
                if attempt >= self.retries:
                    break
                time.sleep(min(2**attempt, 30.0))

        raise CrawlError(f"request failed for {url}: {last_error}")

    def _robots_policy(self, url: str) -> RobotFileParser | bool:
        origin = self._origin(url)
        if origin in self._robots:
            return self._robots[origin]

        robots_url = f"{origin}/robots.txt"
        try:
            body, content_type = self._request(robots_url, headers={"Accept": "text/plain"})
            text = body.decode("utf-8", errors="replace")
            if content_type != "text/plain" or "user-agent:" not in text.lower():
                logging.warning("No valid robots.txt rules published at %s; allowing public URLs", robots_url)
                self._robots[origin] = True
            else:
                parser = RobotFileParser(robots_url)
                parser.parse(text.splitlines())
                self._robots[origin] = parser
        except CrawlError as error:
            logging.warning("Could not read %s (%s); allowing public URLs", robots_url, error)
            self._robots[origin] = True
        return self._robots[origin]

    def get(self, url: str, *, accept: str = "text/html") -> tuple[bytes, str]:
        policy = self._robots_policy(url)
        if policy is not True and not policy.can_fetch(USER_AGENT, url):
            raise CrawlError(f"robots.txt disallows {url}")
        return self._request(url, headers={"Accept": accept})

    def graphql(self, query: str, variables: dict[str, Any]) -> dict[str, Any]:
        policy = self._robots_policy(GRAPHQL_URL)
        if policy is not True and not policy.can_fetch(USER_AGENT, GRAPHQL_URL):
            raise CrawlError(f"robots.txt disallows {GRAPHQL_URL}")
        payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
        body, content_type = self._request(
            GRAPHQL_URL,
            data=payload,
            headers={"Accept": "application/json", "Content-Type": "application/json", "Store": STORE_CODE},
        )
        if content_type != "application/json":
            preview = re.sub(r"\s+", " ", body.decode("utf-8", errors="replace"))[:120]
            raise CrawlError(f"catalog API returned {content_type}, not JSON ({preview})")
        result = json.loads(body)
        if result.get("errors"):
            messages = "; ".join(str(item.get("message", item)) for item in result["errors"])
            raise CrawlError(f"catalog API error: {messages}")
        return result.get("data") or {}


CATEGORY_QUERY = """
query CategoryByPath($path: String!) {
  categories(filters: {url_path: {eq: $path}}) {
    items { id uid name url_path }
  }
}
"""

PRODUCTS_QUERY = """
query ProductsByCategory($categoryId: String!, $pageSize: Int!) {
  products(
    filter: {category_id: {eq: $categoryId}}
    sort: {position: ASC}
    pageSize: $pageSize
    currentPage: 1
  ) {
    items {
      name
      sku
      canonical_url
      image { url label }
      small_image { url label }
      thumbnail { url label }
      media_gallery { url label disabled }
    }
  }
}
"""


def load_categories(path: Path) -> dict[str, list[str]]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise CrawlError(f"could not read category config {path}: {error}") from error
    if not isinstance(raw, dict) or not raw:
        raise CrawlError("category config must be a non-empty JSON object")

    categories: dict[str, list[str]] = {}
    for product_type, paths in raw.items():
        if not isinstance(product_type, str) or not isinstance(paths, list) or not paths:
            raise CrawlError(f"invalid category entry: {product_type!r}")
        categories[product_type] = [urljoin(BASE_URL, str(item)) for item in paths]
    return categories


def load_indexed_images(path: Path) -> dict[str, list[str]]:
    """Load verified Aarong image URLs used when the live catalog is unavailable."""
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise CrawlError(f"could not read indexed-image fallback {path}: {error}") from error
    if not isinstance(raw, dict):
        raise CrawlError("indexed-image fallback must be a JSON object")

    indexed: dict[str, list[str]] = {}
    for product_type, urls in raw.items():
        if not isinstance(product_type, str) or not isinstance(urls, list):
            raise CrawlError(f"invalid indexed-image entry: {product_type!r}")
        clean_urls = [str(url) for url in urls if str(url).startswith("https://mcprod.aarong.com/media/catalog/product/")]
        indexed[product_type] = list(dict.fromkeys(clean_urls))
    return indexed


def category_path(source_page: str) -> str:
    path = urlparse(source_page).path.strip("/")
    if path.startswith(f"{STORE_CODE}/"):
        path = path[len(STORE_CODE) + 1 :]
    return path


def unique_records(records: Iterable[ImageRecord]) -> list[ImageRecord]:
    seen: set[str] = set()
    result: list[ImageRecord] = []
    for record in records:
        normalized = record.image_url.split("?", 1)[0]
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(record)
    return result


def records_from_api(fetcher: Fetcher, product_type: str, source_page: str, target: int) -> list[ImageRecord]:
    path = category_path(source_page)
    category_data = fetcher.graphql(CATEGORY_QUERY, {"path": path})
    categories = (category_data.get("categories") or {}).get("items") or []
    if not categories:
        raise CrawlError(f"catalog API did not find category path {path!r}")

    category_id = str(categories[0].get("id") or "")
    if not category_id:
        raise CrawlError(f"category {path!r} has no numeric id")
    product_data = fetcher.graphql(
        PRODUCTS_QUERY,
        {"categoryId": category_id, "pageSize": max(target * 3, 20)},
    )
    products = (product_data.get("products") or {}).get("items") or []
    records: list[ImageRecord] = []

    for product in products:
        canonical_url = str(product.get("canonical_url") or "")
        product_url = (
            canonical_url
            if canonical_url.startswith(("https://", "http://"))
            else urljoin(BASE_URL, f"/{STORE_CODE}/{canonical_url.lstrip('/')}")
        )
        images: list[dict[str, Any]] = []
        for field in ("image", "small_image", "thumbnail"):
            value = product.get(field)
            if isinstance(value, dict):
                images.append(value)
        images.extend(item for item in product.get("media_gallery") or [] if not item.get("disabled"))
        for image in images:
            image_url = str(image.get("url") or "")
            if not image_url:
                continue
            records.append(
                ImageRecord(
                    product_type=product_type,
                    product_name=str(product.get("name") or product_type),
                    sku=str(product.get("sku") or ""),
                    product_url=product_url,
                    source_page=source_page,
                    image_url=image_url,
                    alt_text=str(image.get("label") or product.get("name") or product_type),
                )
            )
            break  # Prefer one representative image per product.
        if len(unique_records(records)) >= target:
            break
    return unique_records(records)


def records_from_markup(fetcher: Fetcher, product_type: str, source_page: str) -> list[ImageRecord]:
    body, content_type = fetcher.get(source_page)
    if content_type != "text/html":
        raise CrawlError(f"category page returned {content_type}, not HTML")
    parser = ProductMarkupParser(source_page)
    parser.feed(body.decode("utf-8", errors="replace"))
    return unique_records(
        ImageRecord(
            product_type=product_type,
            product_name=alt or product_type,
            sku="",
            product_url=product_url,
            source_page=source_page,
            image_url=image_url,
            alt_text=alt or product_type,
        )
        for image_url, product_url, alt in parser.records
    )


def safe_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "product"


def download_record(fetcher: Fetcher, record: ImageRecord, directory: Path, index: int) -> ImageRecord:
    digest = hashlib.sha256(record.image_url.encode("utf-8")).hexdigest()[:10]
    filename_stem = f"{index:02d}-{safe_slug(record.product_name)[:50]}-{digest}"
    for known_extension in set(IMAGE_MIME_EXTENSIONS.values()):
        existing = directory / f"{filename_stem}{known_extension}"
        if existing.is_file() and existing.stat().st_size >= 1024:
            return ImageRecord(**{**asdict(record), "local_path": str(existing)})

    body, content_type = fetcher.get(record.image_url, accept="image/*")
    if content_type not in IMAGE_MIME_EXTENSIONS:
        raise CrawlError(f"{record.image_url} returned non-image type {content_type}")
    if len(body) < 1024:
        raise CrawlError(f"{record.image_url} returned an unexpectedly small image")

    extension = IMAGE_MIME_EXTENSIONS.get(content_type)
    if not extension:
        extension = mimetypes.guess_extension(content_type) or ".img"
    filename = f"{filename_stem}{extension}"
    destination = directory / filename
    destination.write_bytes(body)
    return ImageRecord(**{**asdict(record), "local_path": str(destination)})


def collect_type(
    fetcher: Fetcher,
    product_type: str,
    source_pages: list[str],
    target: int,
    indexed_urls: list[str] | None = None,
) -> list[ImageRecord]:
    # Keep spare candidates because an otherwise valid catalog URL can return a
    # placeholder or non-image response when the actual download is attempted.
    candidate_target = target * 3
    if indexed_urls and len(indexed_urls) >= target:
        logging.info("Using %d verified indexed images for %s", len(indexed_urls), product_type)
        source_page = source_pages[0]
        return [
            ImageRecord(
                product_type=product_type,
                product_name=f"{product_type} product {index:02d}",
                sku=Path(urlparse(image_url).path).stem,
                product_url="",
                source_page=source_page,
                image_url=image_url,
                alt_text=f"Aarong {product_type} product {index:02d}",
            )
            for index, image_url in enumerate(indexed_urls, start=1)
        ][:candidate_target]

    records: list[ImageRecord] = []
    for source_page in source_pages:
        logging.info("Collecting %s from %s", product_type, source_page)
        try:
            records.extend(records_from_api(fetcher, product_type, source_page, candidate_target))
        except CrawlError as api_error:
            logging.warning("Catalog API unavailable for %s: %s", source_page, api_error)
            try:
                records.extend(records_from_markup(fetcher, product_type, source_page))
            except CrawlError as markup_error:
                logging.warning("Markup fallback failed for %s: %s", source_page, markup_error)
        records = unique_records(records)
        if len(records) >= candidate_target:
            return records[:candidate_target]

    if len(records) < target and indexed_urls:
        logging.info("Using %d verified indexed images for %s", len(indexed_urls), product_type)
        source_page = source_pages[0]
        records.extend(
            ImageRecord(
                product_type=product_type,
                product_name=f"{product_type} product {index:02d}",
                sku=Path(urlparse(image_url).path).stem,
                product_url="",
                source_page=source_page,
                image_url=image_url,
                alt_text=f"Aarong {product_type} product {index:02d}",
            )
            for index, image_url in enumerate(indexed_urls, start=1)
        )
        records = unique_records(records)
    return records[:candidate_target]


def write_type_readme(directory: Path, product_type: str, records: list[ImageRecord]) -> None:
    lines = [
        f"# Aarong {product_type} images",
        "",
        f"Source category: [{records[0].source_page}]({records[0].source_page})" if records else "",
        "",
        "These images were downloaded from Aarong's public product catalog for local research. "
        "Aarong retains ownership of its product imagery; verify permission before reuse.",
        "",
        "| # | Preview | Source image |",
        "|---:|---|---|",
    ]
    for index, record in enumerate(records, start=1):
        filename = Path(record.local_path).name
        lines.append(f"| {index} | ![{record.alt_text}](./{filename}) | [Aarong image]({record.image_url}) |")
    lines.append("")
    (directory / "README.md").write_text("\n".join(lines), encoding="utf-8")


def write_exports(output: Path, records: list[ImageRecord], failures: dict[str, str]) -> None:
    output.mkdir(parents=True, exist_ok=True)
    serialized = [asdict(record) for record in records]
    (output / "catalog.json").write_text(
        json.dumps({"source": BASE_URL, "products": serialized, "failures": failures}, indent=2),
        encoding="utf-8",
    )
    with (output / "catalog.csv").open("w", encoding="utf-8", newline="") as handle:
        fields = list(ImageRecord.__dataclass_fields__)
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(serialized)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG, help="JSON product-type mapping")
    parser.add_argument(
        "--indexed-images",
        type=Path,
        default=DEFAULT_INDEXED_IMAGES,
        help="verified image URLs used when Aarong's live catalog is unavailable",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="dataset output directory")
    parser.add_argument("--images-per-type", type=int, default=10, help="required images per type (default: 10)")
    parser.add_argument("--types", nargs="+", help="only crawl these configured product types")
    parser.add_argument("--delay", type=float, default=1.5, help="minimum seconds between requests")
    parser.add_argument("--timeout", type=float, default=30.0, help="request timeout in seconds")
    parser.add_argument("--retries", type=int, default=2, help="retries for transient failures")
    parser.add_argument("--metadata-only", action="store_true", help="save remote URLs without image files")
    parser.add_argument("--list-types", action="store_true", help="print configured product types and exit")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    if args.images_per_type < 1:
        raise CrawlError("--images-per-type must be at least 1")
    if args.delay < 0:
        raise CrawlError("--delay cannot be negative")

    categories = load_categories(args.config)
    indexed_images = load_indexed_images(args.indexed_images)
    if args.list_types:
        for name, pages in categories.items():
            print(f"{name}: {', '.join(pages)}")
        return 0

    if args.types:
        unknown = sorted(set(args.types) - set(categories))
        if unknown:
            raise CrawlError(f"unknown product type(s): {', '.join(unknown)}")
        categories = {name: categories[name] for name in args.types}

    fetcher = Fetcher(delay=args.delay, timeout=args.timeout, retries=args.retries)
    downloaded: list[ImageRecord] = []
    failures: dict[str, str] = {}

    for product_type, source_pages in categories.items():
        candidates = collect_type(
            fetcher,
            product_type,
            source_pages,
            args.images_per_type,
            indexed_images.get(product_type),
        )
        if len(candidates) < args.images_per_type:
            failures[product_type] = (
                f"found {len(candidates)} product images; required {args.images_per_type}"
            )
            logging.error("%s: %s", product_type, failures[product_type])
            continue

        type_directory = args.output / safe_slug(product_type)
        type_directory.mkdir(parents=True, exist_ok=True)
        if args.metadata_only:
            downloaded.extend(candidates[: args.images_per_type])
            continue

        successful: list[ImageRecord] = []
        for index, candidate in enumerate(candidates, start=1):
            try:
                successful.append(download_record(fetcher, candidate, type_directory, index))
            except CrawlError as error:
                logging.error("Could not download %s: %s", candidate.image_url, error)
            if len(successful) >= args.images_per_type:
                break
        if len(successful) < args.images_per_type:
            failures[product_type] = (
                f"downloaded {len(successful)} valid images; required {args.images_per_type}"
            )
            logging.error("%s: %s", product_type, failures[product_type])
        if successful:
            write_type_readme(type_directory, product_type, successful)
        downloaded.extend(successful)

    write_exports(args.output, downloaded, failures)
    summary = {name: sum(item.product_type == name for item in downloaded) for name in categories}
    print(json.dumps({"output": str(args.output), "counts": summary, "failures": failures}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CrawlError as error:
        logging.error("%s", error)
        raise SystemExit(2)
