const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chatwave-core";

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
    });
    console.log("[realtime-service] Connected to MongoDB");
  } catch (err) {
    console.error("[realtime-service] Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

module.exports = {
  connectToDatabase,
};

