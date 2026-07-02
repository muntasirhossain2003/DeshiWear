import express from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
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

    const order = await Order.create({
      user: req.user._id,
      orderItems: cart.products,
      shippingAddress,
      paymentMethod: paymentMethod || "Cash on Delivery",
      itemsPrice,
      shippingPrice,
      totalPrice: itemsPrice + shippingPrice,
    });

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
