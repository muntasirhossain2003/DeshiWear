import unittest

try:
    from scripts.crawl_aarong import (
        BASE_URL,
        ImageRecord,
        ProductMarkupParser,
        category_path,
        records_from_api,
        unique_records,
    )
except ModuleNotFoundError:
    from crawl_aarong import (
        BASE_URL,
        ImageRecord,
        ProductMarkupParser,
        category_path,
        records_from_api,
        unique_records,
    )


class FakeFetcher:
    def __init__(self):
        self.calls = []

    def graphql(self, query, variables):
        self.calls.append(variables)
        if "path" in variables:
            return {
                "categories": {
                    "items": [{"id": 42, "uid": "NDI=", "name": "Saree", "url_path": variables["path"]}]
                }
            }
        return {
            "products": {
                "items": [
                    {
                        "name": "Red Saree",
                        "sku": "SAR-1",
                        "canonical_url": "red-saree.html",
                        "image": {"url": "https://media.aarong.com/media/catalog/product/r/e/red.jpg", "label": "Red Saree"},
                        "media_gallery": [],
                    },
                    {
                        "name": "Blue Saree",
                        "sku": "SAR-2",
                        "canonical_url": "https://www.aarong.com/bgd/blue-saree.html",
                        "image": {"url": "https://media.aarong.com/media/catalog/product/b/l/blue.jpg", "label": "Blue Saree"},
                        "media_gallery": [],
                    },
                ]
            }
        }


class CrawlerTests(unittest.TestCase):
    def test_category_path_removes_store_prefix(self):
        self.assertEqual(category_path(f"{BASE_URL}/bgd/women/saree"), "women/saree")

    def test_markup_parser_only_accepts_product_media(self):
        parser = ProductMarkupParser(f"{BASE_URL}/bgd/women/saree")
        parser.feed(
            '<img src="https://media.aarong.com/media/collateral/banner.jpg">'
            '<a href="/bgd/red-saree.html"><img alt="Red Saree" '
            'src="https://media.aarong.com/media/catalog/product/r/e/red.jpg"></a>'
        )
        self.assertEqual(
            parser.records,
            [
                (
                    "https://media.aarong.com/media/catalog/product/r/e/red.jpg",
                    f"{BASE_URL}/bgd/red-saree.html",
                    "Red Saree",
                )
            ],
        )

    def test_api_uses_category_id_and_one_image_per_product(self):
        fetcher = FakeFetcher()
        records = records_from_api(fetcher, "Saree", f"{BASE_URL}/bgd/women/saree", 2)
        self.assertEqual([record.sku for record in records], ["SAR-1", "SAR-2"])
        self.assertEqual(fetcher.calls[1]["categoryId"], "42")
        self.assertEqual(records[0].product_url, f"{BASE_URL}/bgd/red-saree.html")
        self.assertEqual(records[1].product_url, f"{BASE_URL}/bgd/blue-saree.html")

    def test_unique_records_ignores_image_query_string(self):
        first = ImageRecord("Saree", "A", "1", "", "", "https://example.test/a.jpg?w=100")
        second = ImageRecord("Saree", "A", "1", "", "", "https://example.test/a.jpg?w=500")
        self.assertEqual(unique_records([first, second]), [first])


if __name__ == "__main__":
    unittest.main()
