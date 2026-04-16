// seed.js
// Usage: node seed.js
// Env: MONGO_URI (optional, default mongodb://localhost:27017/chatwave_loadtest)

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/chatwave_loadtest";

const User = require("./src/models/User");
const ChatMessage = require("./src/models/ChatMessage");

// Simple conversation model for load testing
const conversationSchema = new mongoose.Schema(
  {
    memberIds: [{ type: String, index: true }],
  },
  { timestamps: true }
);

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPastDate(daysBack = 30) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

function randomContent() {
  const samples = [
    "Hello there!",
    "How are you doing today?",
    "This is a test message.",
    "Let’s ship this feature.",
    "Latency looks good.",
    "Checking performance under load.",
    "Random chat content.",
    "What’s up?",
    "Node.js and MongoDB testing.",
    "k6 load test message.",
  ];
  return samples[randomInt(0, samples.length - 1)];
}

async function main() {
  console.log("Connecting to MongoDB:", MONGO_URI);
  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 20,
  });

  console.log("Dropping existing data in collections (if any)...");
  await Promise.all([
    User.deleteMany({}),
    Conversation.deleteMany({}),
    ChatMessage.deleteMany({}),
  ]);

  const NUM_USERS = 50;
  const MIN_CONV_PER_USER = 5;
  const MAX_CONV_PER_USER = 10;
  const MIN_MEMBERS_PER_CONV = 2;
  const MAX_MEMBERS_PER_CONV = 5;
  const MIN_MSG_PER_CONV = 50;
  const MAX_MSG_PER_CONV = 200;

  // ---------- Users ----------
  console.log(`Seeding ${NUM_USERS} users...`);

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 8);
  const passwordHash = await bcrypt.hash("123123", saltRounds);

  const userDocs = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    userDocs.push({
      email: `user${i}@test.com`,
      passwordHash,
      username: `User ${i}`,
      phone: null,
      avatar: null,
      bio: "",
    });
  }

  const users = await User.insertMany(userDocs, { ordered: false });
  console.log("Inserted users:", users.length);

  const userIds = users.map((u) => u.id);

  // ---------- Conversations ----------
  console.log("Seeding conversations...");
  const conversationDocs = [];

  for (const user of users) {
    const convCount = randomInt(MIN_CONV_PER_USER, MAX_CONV_PER_USER);

    for (let c = 0; c < convCount; c++) {
      const memberSet = new Set();
      memberSet.add(user.id);

      const membersToAdd = randomInt(
        MIN_MEMBERS_PER_CONV - 1,
        MAX_MEMBERS_PER_CONV - 1
      );

      while (memberSet.size < membersToAdd + 1) {
        const randomUserId =
          userIds[randomInt(0, userIds.length - 1)];
        memberSet.add(randomUserId);
      }

      conversationDocs.push({
        memberIds: Array.from(memberSet),
      });
    }
  }

  const conversations = await Conversation.insertMany(conversationDocs, {
    ordered: false,
  });
  console.log("Inserted conversations:", conversations.length);

  // ---------- Messages ----------
  console.log("Seeding messages (this may take a bit)...");
  const messagesBatch = [];
  const BATCH_SIZE = 5000;

  for (const conv of conversations) {
    const msgCount = randomInt(MIN_MSG_PER_CONV, MAX_MSG_PER_CONV);
    const memberIds = conv.memberIds;

    for (let m = 0; m < msgCount; m++) {
      const senderId = memberIds[randomInt(0, memberIds.length - 1)];
      messagesBatch.push({
        conversationId: conv.id,
        senderId,
        senderName: "Seed User",
        conversationName: null,
        text: randomContent(),
        imageUrl: null,
        createdAt: randomPastDate(30),
        updatedAt: new Date(),
      });

      if (messagesBatch.length >= BATCH_SIZE) {
        await ChatMessage.insertMany(messagesBatch, { ordered: false });
        messagesBatch.length = 0;
        console.log("Inserted batch of messages...");
      }
    }
  }

  if (messagesBatch.length > 0) {
    await ChatMessage.insertMany(messagesBatch, { ordered: false });
  }

  const totalMessages = await ChatMessage.countDocuments({});
  console.log("Total messages inserted:", totalMessages);

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

