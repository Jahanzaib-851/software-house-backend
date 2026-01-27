// src/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  const connectionOptions = {
    // Sirf wahi options jo naye Mongoose version support karte hain
    serverSelectionTimeoutMS: 20000, // 20 seconds wait karega slow net par
    socketTimeoutMS: 45000,
    maxPoolSize: 50,
  };

  try {
    // Agar pehle se connect ho raha ho to dobara start na karein
    if (mongoose.connection.readyState >= 1) return;

    const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);

    // Retry logic: 5 second baad dobara koshish karein
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// Event listeners for stability
mongoose.connection.on("error", (err) => {
  console.error("🔥 MongoDB Runtime Error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB Disconnected! Re-connecting...");
  // Connection tootne par auto-retry
  connectDB();
});

export default connectDB;