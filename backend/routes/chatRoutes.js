import express from "express";
import { getChatReply } from "../utils/aiChat.js";

const router = express.Router();

// POST /api/chat — { messages: [{ role: "user"|"assistant", content }] }
router.post("/", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: "messages array is required" });
  }
  if (messages.length > 20) {
    return res.status(400).json({ message: "Conversation too long for this request" });
  }

  try {
    const { reply, provider, products } = await getChatReply(messages);
    res.json({
      reply,
      provider,
      products: products.map((p) => ({ _id: p._id, name: p.name })),
    });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(503).json({ message: error.message || "AI assistant is temporarily unavailable" });
  }
});

export default router;
