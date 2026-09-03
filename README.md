# DeshiWear

DeshiWear is a modern e-commerce platform specializing in traditional and contemporary Bangladeshi fashion. Built with cutting-edge technologies to provide a seamless shopping experience.

## 🚀 Features

- Responsive design for all devices
- Modern and intuitive user interface
- Fast and reliable worldwide shipping
- Social media integration
- Real-time customer support

## 🛠️ Tech Stack

### Frontend

- React.js with Vite
- Tailwind CSS for styling
- React Icons for UI elements
- Responsive design principles

### Backend

- Node.js + Express REST API
- MongoDB with Mongoose (embedded dev DB, Atlas-ready)
- JWT authentication (customer/admin roles)
- Cash on Delivery orders with Dhaka-aware delivery charges

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/muntasirhossain2003/DeshiWear.git
cd DeshiWear
```

2. Start the backend (API on http://localhost:9002 — an embedded MongoDB starts automatically, no install needed):

```bash
cd backend
npm install
npm run seed   # first time only: loads 20 products + admin account
npm run dev
```

3. Start the frontend (http://localhost:5173) in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Admin login: `admin@deshiwear.com` / `admin123` → then visit `/admin`.

For a real database, set `MONGO_URI` in `backend/.env` to a MongoDB Atlas connection string.

## Aarong product-image research crawler

The repository includes a dependency-free Python crawler that maps directly matching Aarong public catalog routes to all sixteen DeshiWear product types plus seven child apparel segments, and collects ten representative product images per type. It writes each type to its own folder with a Markdown index, plus attributed JSON/CSV metadata under `data/aarong/`; it does not modify the seed database. `Kurti`/`Kurta` and `Three Piece`/`Shalwar Kameez` are retained as separate DeshiWear labels even though each pair maps to the same Aarong category.

```bash
python3 scripts/crawl_aarong.py --list-types
python3 scripts/crawl_aarong.py --images-per-type 10
```

Useful options:

```bash
# Crawl only selected types
python3 scripts/crawl_aarong.py --types Saree Panjabi --images-per-type 10

# Export image URLs and product metadata without downloading files
python3 scripts/crawl_aarong.py --metadata-only

# Use a custom product-type-to-category mapping
python3 scripts/crawl_aarong.py --config scripts/aarong_categories.json
```

The crawler checks robots rules, identifies itself, waits 1.5 seconds between requests, retries transient failures, rejects non-image responses, and exits non-zero if any product type has fewer than the requested number of valid images. When Aarong's live catalog API is under maintenance, it can use the verified public image URLs in `scripts/aarong_indexed_images.json`. Aarong's images and product data remain Aarong's property; verify permission/licensing before using the downloaded files in production or marketing.

## Catalog builder

`data/` holds ~70 MB of full-resolution research images and stays out of git. `scripts/build_catalog.py` turns it into what the app actually ships:

```bash
python3 scripts/build_catalog.py
```

It writes three things, all generated — edit the inputs, not the outputs:

| Output | Contents |
| --- | --- |
| `frontend/public/products/<type>/NN.webp` | every photo downscaled to 800px WebP (~70 MB → ~12 MB) |
| `backend/data/products.js` | 115 seed products across all 16 storefront categories |
| `frontend/src/data/catalogFacets.js` | the category/colour/size/material lists the filter sidebar renders |

Product copy — names, descriptions, prices, size runs, tags — lives in `scripts/catalog_copy.py`. Colours are not written by hand: the builder samples each photograph, subtracts the studio backdrop (estimated from the image corners) and the skin-tone band, then matches what remains to the storefront palette in CIELAB. So filtering by "Maroon" returns things that are actually maroon.

Generating the sidebar's facets from the seeded products is deliberate — the lists were previously maintained by hand and had drifted to offering seven categories with nothing behind them.

Re-running is idempotent: same inputs produce a byte-identical seed, so a rebuild shows no diff. Run `npm run seed` in `backend/` afterwards to load the regenerated catalog.

## 🌐 Environment Setup

Make sure you have the following installed:

- Node.js (Latest LTS version)
- npm (comes with Node.js)

## 📞 Contact

For support or inquiries:

- Phone: (+880) 1748 004936
- email: muntasirhossain2003@gmail.com

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](#).

## 📜 License

[Add your license information]

---

Made with ❤️ in Bangladesh
