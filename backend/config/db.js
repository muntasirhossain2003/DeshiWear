import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connects to MONGO_URI when provided; otherwise boots an embedded MongoDB
// that persists data in backend/.mongo-data so dev works with zero setup.
const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    if (!uri) {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const dbPath = path.join(__dirname, "..", ".mongo-data");
      fs.mkdirSync(dbPath, { recursive: true });
      const mongod = await MongoMemoryServer.create({
        instance: { dbPath, storageEngine: "wiredTiger", port: 27099 },
      });
      uri = `${mongod.getUri()}deshiwear`;
      console.log("Embedded MongoDB started (data persisted in .mongo-data)");
    }

    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
