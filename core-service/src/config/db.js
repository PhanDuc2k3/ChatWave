const mongoose = require("mongoose");

const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chatwave";

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            autoIndex: true,
        });
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        // Fail hard so container/orchestrator can restart
        process.exit(1);
    }
}

module.exports = {
    connectToDatabase,
};

