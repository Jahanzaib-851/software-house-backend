import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";

import routes from "./routes/index.js";
import errorHandler from "./middlewares/error.middleware.js";
import ApiError from "./utils/ApiError.js";

dotenv.config();

const app = express();

// ==========================================
// 🛠️ HELMET CONFIG
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
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
// 🛠️ CORS FIX (Local + Vercel Dono Ke Liye)
// ==========================================
const allowedOrigins = [
  "http://localhost:3000",
  "https://software-house-frontend.vercel.app" // Aapka live frontend link
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy does not allow access from this origin."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// ==========================================
// 🛠️ STATIC FILES
// ==========================================
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 API is running perfectly",
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