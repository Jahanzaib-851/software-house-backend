import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path"; // ✅ Added path import

import routes from "./routes/index.js";
import errorHandler from "./middlewares/error.middleware.js";
import ApiError from "./utils/ApiError.js";

dotenv.config();

const app = express();

// ==========================================
// 🛠️ HELMET FIX: Images load karne ke liye policy relax ki hai
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: false, // ✅ Zaroori hai taake frontend images load kar sake
  })
);

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Logger (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ==========================================
// 🛠️ CORS FIX
// ==========================================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// ==========================================
// 🛠️ STATIC FILES: Images serve karne ke liye
// ==========================================
// Ye line batati hai ke 'uploads' folder ko browser se access kiya ja sakta hai
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 API is running",
  });
});

// API routes
app.use("/api", routes);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandler);

export default app;