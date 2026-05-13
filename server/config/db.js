import mongoose from "mongoose";

const MAX_RETRIES   = 5;
const RETRY_DELAY   = 3000; // ms

async function connectDB(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("[DB] MongoDB connected successfully");

    mongoose.connection.on("disconnected", () => {
      console.warn("[DB] MongoDB disconnected — attempting reconnect…");
    });

    mongoose.connection.on("error", (err) => {
      console.error("[DB] MongoDB error:", err.message);
    });

  } catch (error) {
    console.error(`[DB] Connection attempt ${attempt} failed: ${error.message}`);
    if (attempt < MAX_RETRIES) {
      console.log(`[DB] Retrying in ${RETRY_DELAY / 1000}s…`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      return connectDB(attempt + 1);
    }
    console.error("[DB] Max retries reached. Exiting.");
    process.exit(1);
  }
}

export default connectDB;