import express from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Inside Dhaka: 60tk, outside: 120tk. Free over 2000tk.
const shippingFor = (city, itemsPrice) => {
  if (itemsPrice >= 2000) return 0;
  return /dhaka/i.test(city || "") ? 60 : 120;
};

// POST /api/orders — place order from current cart (COD for Phase 1)
router.post("/", protect, async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }
    if (!shippingAddress?.firstName || !shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.phone) {
      return res.status(400).json({ message: "Shipping name, address, city and phone are required" });
    }

    const itemsPrice = cart.totalPrice;
    const shippingPrice = shippingFor(shippingAddress.city, itemsPrice);

    // Revalidate and allocate stock at commit time. Cart quantities are only a
    // quote; concurrent web/POS checkouts must never oversell the catalog.
    const allocated = [];
    for (const item of cart.products) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, isPublished: true, countInStock: { $gte: item.quantity } },
        { $inc: { countInStock: -item.quantity } },
        { new: true }
      );
      if (!product) {
        for (const prior of allocated) await Product.updateOne({ _id: prior.productId }, { $inc: { countInStock: prior.quantity } });
        return res.status(409).json({ message: `${item.name} is no longer available in the requested quantity` });
      }
      allocated.push({ productId: item.productId, quantity: item.quantity });
    }

    let order;
    try {
      order = await Order.create({
        user: req.user._id,
        orderItems: cart.products,
        shippingAddress,
        paymentMethod: paymentMethod || "Cash on Delivery",
        itemsPrice,
        shippingPrice,
        totalPrice: itemsPrice + shippingPrice,
      });
    } catch (createError) {
      for (const prior of allocated) await Product.updateOne({ _id: prior.productId }, { $inc: { countInStock: prior.quantity } });
      throw createError;
    }

    cart.products = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/orders/my-orders
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/orders/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
