import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import crAdminRoutes from "./routes/cradmin.routes.js";
import courseRoutes from "./routes/course.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";
import resultRoutes from "./routes/result.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import routineRoutes from "./routes/routine.routes.js";
import noticeRoutes from "./routes/notice.routes.js";
import eventRoutes from "./routes/event.routes.js";
import questionBankRoutes from "./routes/questionbank.routes.js";
import fileRoutes from "./routes/file.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import batchRoutes from "./routes/batch.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigin = allowedOrigins.includes("*")
  ? true
  : allowedOrigins.length > 0
    ? allowedOrigins
    : true;

// Middleware
app.use(
  cors({
    origin: corsOrigin,
    credentials: false,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart UniAssistant Backend Running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    message: "Smart UniAssistant API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/cradmin", crAdminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/questionbanks", questionBankRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/batches", batchRoutes);

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
