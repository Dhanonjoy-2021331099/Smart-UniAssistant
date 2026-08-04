import mongoose from "mongoose";
import TeacherCourse from "../models/TeacherCourse.js";
import Result from "../models/Result.js";

const connectDB = async () => {
  try {
    const MONGO_URL =
      process.env.MONGO_URL ||
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017";
    const DB_NAME = process.env.DB_NAME || "smart-uniassistant";

    await mongoose.connect(MONGO_URL, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 10000,
    });

    // Drop stale/legacy indexes that no longer match the schemas.
    // Without this, old unique indexes (e.g. { teacher, course, batch }) keep
    // blocking valid inserts because the fields no longer exist on new documents.
    await Promise.all([
      TeacherCourse.syncIndexes(),
      Result.syncIndexes(),
    ]);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
