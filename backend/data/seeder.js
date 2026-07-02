import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import products from "./products.js";

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    await Promise.all([Product.deleteMany(), User.deleteMany(), Cart.deleteMany()]);

    const admin = await User.create({
      name: "Admin",
      email: "admin@deshiwear.com",
      password: "admin123",
      role: "admin",
    });

    await Product.insertMany(products.map((p) => ({ ...p, user: admin._id })));

    console.log(`Seeded ${products.length} products.`);
    console.log("Admin login -> admin@deshiwear.com / admin123");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
