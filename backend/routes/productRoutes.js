import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET /api/products — list with filters, search and sort
router.get("/", async (req, res) => {
  try {
    const {
      collection,
      size,
      color,
      gender,
      minPrice,
      maxPrice,
      sortBy,
      search,
      category,
      material,
      limit,
    } = req.query;

    const query = { isPublished: true };

    if (collection && collection.toLowerCase() !== "all") query.collections = collection;
    if (category && category.toLowerCase() !== "all") query.category = category;
    if (material) query.material = { $in: material.split(",") };
    if (size) query.sizes = { $in: size.split(",") };
    if (color) query.colors = { $in: color.split(",") };
    if (gender) query.gender = gender;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    let sort = { createdAt: -1 };
    if (sortBy === "priceAsc") sort = { price: 1 };
    else if (sortBy === "priceDesc") sort = { price: -1 };
    else if (sortBy === "popularity") sort = { rating: -1 };

    const products = await Product.find(query)
      .sort(sort)
      .limit(Number(limit) || 0);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/products/new-arrivals — latest 8 products
router.get("/new-arrivals", async (req, res) => {
  try {
    const products = await Product.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/products/featured
router.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isPublished: true }).limit(4);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/products/similar/:id — same category, different product
router.get("/similar/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const similar = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isPublished: true,
    }).limit(4);
    res.json(similar);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
