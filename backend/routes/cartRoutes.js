import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const getCart = (userId, guestId) => {
  if (userId) return Cart.findOne({ user: userId });
  if (guestId) return Cart.findOne({ guestId });
  return null;
};

const recalc = (cart) => {
  cart.totalPrice = cart.products.reduce((acc, p) => acc + p.price * p.quantity, 0);
};

// POST /api/cart — add an item (guest or logged in)
router.post("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await getCart(userId, guestId);
    const item = {
      productId,
      name: product.name,
      image: product.images[0]?.url,
      price: product.discountPrice || product.price,
      size,
      color,
      quantity: Number(quantity) || 1,
    };

    if (!cart) {
      cart = await Cart.create({
        user: userId || undefined,
        guestId: guestId || `guest_${Date.now()}`,
        products: [item],
        totalPrice: item.price * item.quantity,
      });
      return res.status(201).json(cart);
    }

    const existing = cart.products.find(
      (p) => p.productId.toString() === productId && p.size === size && p.color === color
    );
    if (existing) existing.quantity += item.quantity;
    else cart.products.push(item);

    recalc(cart);
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/cart — update quantity (0 removes)
router.put("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  try {
    const cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const index = cart.products.findIndex(
      (p) => p.productId.toString() === productId && p.size === size && p.color === color
    );
    if (index === -1) return res.status(404).json({ message: "Item not in cart" });

    if (quantity > 0) cart.products[index].quantity = quantity;
    else cart.products.splice(index, 1);

    recalc(cart);
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/cart — remove an item
router.delete("/", async (req, res) => {
  const { productId, size, color, guestId, userId } = req.body;
  try {
    const cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = cart.products.filter(
      (p) => !(p.productId.toString() === productId && p.size === size && p.color === color)
    );
    recalc(cart);
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/cart?userId=&guestId=
router.get("/", async (req, res) => {
  const { userId, guestId } = req.query;
  try {
    const cart = await getCart(userId, guestId);
    if (!cart) return res.json({ products: [], totalPrice: 0 });
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/cart/merge — merge guest cart into user cart on login
router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;
  try {
    const guestCart = await Cart.findOne({ guestId });
    const userCart = await Cart.findOne({ user: req.user._id });

    if (!guestCart || guestCart.products.length === 0) {
      return res.json(userCart || { products: [], totalPrice: 0 });
    }

    if (!userCart) {
      guestCart.user = req.user._id;
      guestCart.guestId = undefined;
      await guestCart.save();
      return res.json(guestCart);
    }

    for (const item of guestCart.products) {
      const existing = userCart.products.find(
        (p) =>
          p.productId.toString() === item.productId.toString() &&
          p.size === item.size &&
          p.color === item.color
      );
      if (existing) existing.quantity += item.quantity;
      else userCart.products.push(item);
    }
    recalc(userCart);
    await userCart.save();
    await Cart.deleteOne({ _id: guestCart._id });
    res.json(userCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
