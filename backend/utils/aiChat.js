import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/Product.js";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const STORE_FACTS = `
Store facts you must use when relevant:
- Currency: Bangladeshi Taka (৳). Always show prices with the ৳ symbol.
- Payment: Cash on Delivery (COD) only for now.
- Delivery charge: ৳60 inside Dhaka, ৳120 outside Dhaka. FREE delivery on orders ৳2,000+.
- Delivery time: ~2 days inside Dhaka, ~5 days outside Dhaka.
- Order tracking: customers can see live status (Processing → Shipped → Delivered) on their Profile page under "My Orders".
- Sizes vary by product (S/M/L/XL or numeric); always ask the customer's usual size if recommending an item.
`;

const buildSystemPrompt = (productContext) => `You are "Deshi Sohayok" (দেশি সহায়ক), the friendly AI shopping assistant for DeshiWear, an online store for Bangladeshi fashion (panjabi, saree, kurti, shawls, t-shirts, and more).

Reply in the same language/style the customer uses — Bangla, English, or Banglish (mixed). Keep replies short (2-5 sentences) and warm, like a helpful shop assistant, not a corporate bot.

${STORE_FACTS}

${productContext ? `Relevant products found in the catalog right now:\n${productContext}\n\nOnly recommend products from this list — do not invent products, prices, or stock that aren't listed here.` : "No specific products were found matching this query in the catalog — say so honestly and suggest the customer browse the Collections page, rather than inventing product names."}

Never make up delivery dates, discounts, or policies beyond what's stated above.`;

const searchRelevantProducts = async (userMessage) => {
  const keywords = userMessage
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6);

  if (keywords.length === 0) return [];

  const regexes = keywords.map((k) => new RegExp(k, "i"));
  const products = await Product.find({
    isPublished: true,
    $or: [
      { name: { $in: regexes } },
      { category: { $in: regexes } },
      { collections: { $in: regexes } },
      { tags: { $in: regexes } },
      { description: { $in: regexes } },
    ],
  })
    .limit(5)
    .select("name price discountPrice category collections sizes colors countInStock _id");

  return products;
};

const formatProductContext = (products) =>
  products
    .map(
      (p) =>
        `- ${p.name} (${p._id}) — ${p.category}, ${p.collections} — ৳${
          p.discountPrice || p.price
        }${p.discountPrice ? ` (was ৳${p.price})` : ""} — sizes: ${p.sizes.join(", ")} — ${
          p.countInStock > 0 ? "in stock" : "out of stock"
        }`
    )
    .join("\n");

const toGroqMessages = (systemPrompt, history) => [
  { role: "system", content: systemPrompt },
  ...history.map((m) => ({ role: m.role, content: m.content })),
];

const askGroq = async (systemPrompt, history) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: toGroqMessages(systemPrompt, history),
    max_tokens: 400,
    temperature: 0.6,
  });
  return completion.choices[0]?.message?.content?.trim();
};

const askGemini = async (systemPrompt, history) => {
  const model = gemini.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  });
  const last = history[history.length - 1];
  const chat = model.startChat({
    history: history.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });
  const result = await chat.sendMessage(last.content);
  return result.response.text().trim();
};

export const getChatReply = async (history) => {
  if (!groq && !gemini) {
    throw new Error(
      "AI assistant is not configured yet — add GROQ_API_KEY or GEMINI_API_KEY to backend/.env"
    );
  }

  const lastUserMessage = [...history].reverse().find((m) => m.role === "user")?.content || "";
  const products = await searchRelevantProducts(lastUserMessage);
  const systemPrompt = buildSystemPrompt(products.length ? formatProductContext(products) : "");

  if (groq) {
    try {
      const reply = await askGroq(systemPrompt, history);
      if (reply) return { reply, provider: "groq", products };
    } catch (error) {
      console.error("Groq chat failed, falling back to Gemini:", error.message);
    }
  }

  if (gemini) {
    const reply = await askGemini(systemPrompt, history);
    return { reply, provider: "gemini", products };
  }

  throw new Error("AI assistant is temporarily unavailable. Please try again shortly.");
};
