import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";

import connectDB from "./config/db.js";
import { initAuth, getAuth } from "./config/auth.js";
import carRoutes from "./routes/cars.js";
import bookingRoutes from "./routes/bookings.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first — mongoose.connection.db must be live
// before initAuth() is called.
await connectDB();
initAuth();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Better Auth handler — must come before express.json()
// getAuth() is safe here because initAuth() has already been called above.
app.all("/api/auth/*", toNodeHandler(getAuth()));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "DriveFleet API is running 🚀", status: "OK" });
});

// API Routes
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DriveFleet Server running on port ${PORT}`);
  console.log(`🌐 Auth URL: ${process.env.BETTER_AUTH_URL}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});

export default app;
