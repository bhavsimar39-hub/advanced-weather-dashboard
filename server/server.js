import express        from "express";
import dotenv         from "dotenv";
import cors           from "cors";
import helmet         from "helmet";
import morgan         from "morgan";
import mongoose       from "mongoose";

import connectDB      from "./config/db.js";
import authRoutes     from "./routes/authRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import weatherRoutes  from "./routes/weatherRoutes.js";
import errorHandler   from "./middleware/globalError.js";
import { apiLimiter, authLimiter, weatherLimiter } from "./middleware/ratelimiter.js";

dotenv.config();

// ─── VALIDATE ENV ───────────────────────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "WEATHER_API_KEY"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing environment variable: ${key}`);
    process.exit(1);
  }
});

// ─── APP ────────────────────────────────────────────────────
const app = express();

// ─── SECURITY MIDDLEWARE ─────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://cdn.weatherapi.com"],
    },
  },
}));

const ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN || "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ─── BODY & LOGGING ─────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── GLOBAL RATE LIMIT ──────────────────────────────────────
app.use("/api", apiLimiter);

// ─── HEALTH CHECK ───────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── ROUTES ─────────────────────────────────────────────────
app.use("/api/auth",      authLimiter,    authRoutes);
app.use("/api/weather",   weatherLimiter, weatherRoutes);
app.use("/api/favorites",                 favoriteRoutes);

// ─── 404 ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── GLOBAL ERROR HANDLER ───────────────────────────────────
app.use(errorHandler);

// ─── START ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[SERVER] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close();
      console.log("[SERVER] MongoDB connection closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

start();