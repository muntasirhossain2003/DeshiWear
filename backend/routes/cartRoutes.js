import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { identify, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Every cart endpoint serves both guests and signed-in shoppers.
router.use(identify);

// Resolve whose cart this request may touch.
//
// The owner comes from the verified token, never from the request body. An
// earlier version read `userId` off the payload, which let anyone who knew an
// account id — it is returned by login and register — read, fill or empty that
// account's cart with no token at all.
const cartOwner = (req) => {
  const guestId = req.body?.guestId || req.query?.guestId;
  if (req.user) return { user: req.user._id };
  return guestId ? { guestId } : null;
};

const getCart = (owner) => (owner ? Cart.findOne(owner) : null);

const recalc = (cart) => {
  cart.totalPrice = cart.products.reduce((acc, p) => acc + p.price * p.quantity, 0);
};

// POST /api/cart — add an item (guest or logged in)
router.post("/", async (req, res) => {
  const { productId, quantity, size, color } = req.body;
  try {
    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 99) {
      return res.status(400).json({ message: "Quantity must be a whole number between 1 and 99" });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const owner = cartOwner(req);
    if (!owner) return res.status(400).json({ message: "Sign in or supply a guestId" });

    let cart = await getCart(owner);
    const item = {
      productId,
      name: product.name,
      image: product.images[0]?.url,
      price: product.discountPrice || product.price,
      size,
      color,
      quantity: requestedQuantity,
    };

    if (!cart) {
      cart = await Cart.create({
        ...owner,
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
  const { productId, quantity, size, color } = req.body;
  try {
    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 0 || requestedQuantity > 99) {
      return res.status(400).json({ message: "Quantity must be a whole number between 0 and 99" });
    }
    const cart = await getCart(cartOwner(req));
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const index = cart.products.findIndex(
      (p) => p.productId.toString() === productId && p.size === size && p.color === color
    );
    if (index === -1) return res.status(404).json({ message: "Item not in cart" });

    if (requestedQuantity > 0) cart.products[index].quantity = requestedQuantity;
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
  const { productId, size, color } = req.body;
  try {
    const cart = await getCart(cartOwner(req));
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

// GET /api/cart?guestId= — the signed-in cart comes from the token
router.get("/", async (req, res) => {
  try {
    const cart = await getCart(cartOwner(req));
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
