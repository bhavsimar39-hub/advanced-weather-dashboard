import express           from "express";
import dotenv            from "dotenv";
import cors              from "cors";
import helmet            from "helmet";
import morgan            from "morgan";
import mongoose          from "mongoose";
import path              from "path";
import { fileURLToPath } from "url";

// ─── __dirname fix for ES Modules ───────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

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
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc:    ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc:     ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https://cdn.weatherapi.com", "https:"],
      connectSrc:  ["'self'"],
      workerSrc:   ["'self'", "blob:"],
    },
  },
}));

// CORS — needed for local dev only (production serves from same origin)
const ALLOWED_ORIGINS = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
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

// ─── SERVE FRONTEND STATIC FILES ────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── GLOBAL RATE LIMIT ──────────────────────────────────────
app.use("/api", apiLimiter);

// ─── HEALTH CHECK ───────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status:    "ok",
    dbState:   mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API ROUTES ─────────────────────────────────────────────
app.use("/api/auth",      authLimiter,    authRoutes);
app.use("/api/weather",   weatherLimiter, weatherRoutes);
app.use("/api/favorites",                 favoriteRoutes);

// ─── CATCH ALL — serve index.html for any non-API route ─────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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