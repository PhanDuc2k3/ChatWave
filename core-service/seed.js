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
const Post = require("./src/models/Post");

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
    Post.deleteMany({}),
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

  // ---------- 5 New Seed Users with Posts ----------
  console.log("Seeding 5 new users with posts...");

  const newSeedUsers = [
    {
      email: "minh.nguyen@chatwave.com",
      username: "Minh Nguyễn",
      phone: null,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=minh",
      bio: "Frontend Developer | React & Vue enthusiast",
    },
    {
      email: "linh.pham@chatwave.com",
      username: "Linh Phạm",
      phone: null,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=linh",
      bio: "UI/UX Designer | Creative Soul",
    },
    {
      email: "khoa.tran@chatwave.com",
      username: "Khoa Trần",
      phone: null,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=khoa",
      bio: "Backend Developer | Node.js & Go",
    },
    {
      email: "huong.le@chatwave.com",
      username: "Hường Lê",
      phone: null,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=huong",
      bio: "Content Creator | Digital Marketing",
    },
    {
      email: "duong.vo@chatwave.com",
      username: "Dương Võ",
      phone: null,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=duong",
      bio: "Mobile Developer | React Native",
    },
  ];

  const newUsers = await User.insertMany(
    newSeedUsers.map((u) => ({
      ...u,
      passwordHash,
    }))
  );
  console.log("Inserted new seed users:", newUsers.length);

  // ---------- Posts for New Seed Users ----------
  console.log("Seeding posts for new users...");

  const seedPosts = [
    // Minh Nguyễn's posts
    {
      authorId: newUsers[0].id,
      authorName: "Minh Nguyễn",
      authorSubtitle: "Frontend Developer",
      authorAvatar: newUsers[0].avatar,
      text: "Vừa hoàn thành dự án React mới! Một trải nghiệm tuyệt vời với hooks và context API.",
      feeling: "😊 Vui",
      likes: randomInt(15, 50),
      comments: randomInt(3, 12),
      shares: randomInt(1, 5),
      createdAt: randomPastDate(5),
    },
    {
      authorId: newUsers[0].id,
      authorName: "Minh Nguyễn",
      authorSubtitle: "Frontend Developer",
      authorAvatar: newUsers[0].avatar,
      text: "Check out bộ sưu tập gradient backgrounds cho project tiếp theo!",
      imageUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
      likes: randomInt(20, 60),
      comments: randomInt(5, 15),
      shares: randomInt(2, 8),
      createdAt: randomPastDate(3),
    },
    {
      authorId: newUsers[0].id,
      authorName: "Minh Nguyễn",
      authorSubtitle: "Frontend Developer",
      authorAvatar: newUsers[0].avatar,
      text: "Code clean là code happy! Luôn nhớ clean code principles nhé mọi người.",
      imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
      likes: randomInt(25, 70),
      comments: randomInt(8, 20),
      shares: randomInt(3, 10),
      createdAt: randomPastDate(1),
    },

    // Linh Phạm's posts
    {
      authorId: newUsers[1].id,
      authorName: "Linh Phạm",
      authorSubtitle: "UI/UX Designer",
      authorAvatar: newUsers[1].avatar,
      text: "Thiết kế không chỉ là làm đẹp, mà là giải quyết vấn đề một cách thẩm mỹ.",
      feeling: "💡 Sáng tạo",
      likes: randomInt(30, 80),
      comments: randomInt(10, 25),
      shares: randomInt(5, 15),
      createdAt: randomPastDate(4),
    },
    {
      authorId: newUsers[1].id,
      authorName: "Linh Phạm",
      authorSubtitle: "UI/UX Designer",
      authorAvatar: newUsers[1].avatar,
      text: "Moodboard cho dự án branding mới - pastel tones với hints của coral!",
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      likes: randomInt(40, 100),
      comments: randomInt(12, 30),
      shares: randomInt(8, 20),
      createdAt: randomPastDate(2),
    },

    // Khoa Trần's posts
    {
      authorId: newUsers[2].id,
      authorName: "Khoa Trần",
      authorSubtitle: "Backend Developer",
      authorAvatar: newUsers[2].avatar,
      text: "Đang deep dive vào Go lang cho microservices. Performance thật sự ấn tượng!",
      feeling: "🔥 Hứng thú",
      likes: randomInt(18, 45),
      comments: randomInt(4, 15),
      shares: randomInt(2, 6),
      createdAt: randomPastDate(4),
    },
    {
      authorId: newUsers[2].id,
      authorName: "Khoa Trần",
      authorSubtitle: "Backend Developer",
      authorAvatar: newUsers[2].avatar,
      text: "Server architecture mới - từ monolith sang microservices architecture.",
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
      likes: randomInt(35, 90),
      comments: randomInt(8, 22),
      shares: randomInt(5, 12),
      createdAt: randomPastDate(2),
    },
    {
      authorId: newUsers[2].id,
      authorName: "Khoa Trần",
      authorSubtitle: "Backend Developer",
      authorAvatar: newUsers[2].avatar,
      text: "Docker + Kubernetes = Dream team cho deployment. Highly recommend everyone try it!",
      imageUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80",
      likes: randomInt(28, 75),
      comments: randomInt(6, 18),
      shares: randomInt(4, 10),
      createdAt: randomPastDate(1),
    },

    // Hường Lê's posts
    {
      authorId: newUsers[3].id,
      authorName: "Hường Lê",
      authorSubtitle: "Content Creator",
      authorAvatar: newUsers[3].avatar,
      text: "Content is king! Chia sẻ vài tips để viết caption thu hút cho social media.",
      feeling: "✨ Nhiệt tình",
      likes: randomInt(50, 120),
      comments: randomInt(15, 40),
      shares: randomInt(10, 25),
      createdAt: randomPastDate(5),
    },
    {
      authorId: newUsers[3].id,
      authorName: "Hường Lê",
      authorSubtitle: "Content Creator",
      authorAvatar: newUsers[3].avatar,
      text: "Workspace setup cho content creator - aesthetics meets productivity!",
      imageUrl: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80",
      likes: randomInt(60, 150),
      comments: randomInt(20, 50),
      shares: randomInt(12, 30),
      createdAt: randomPastDate(3),
    },
    {
      authorId: newUsers[3].id,
      authorName: "Hường Lê",
      authorSubtitle: "Content Creator",
      authorAvatar: newUsers[3].avatar,
      text: "Camera setup cho beginner vloggers - equipment không cần đắt nhưng phải đúng!",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      likes: randomInt(45, 110),
      comments: randomInt(12, 35),
      shares: randomInt(8, 20),
      createdAt: randomPastDate(1),
    },

    // Dương Võ's posts
    {
      authorId: newUsers[4].id,
      authorName: "Dương Võ",
      authorSubtitle: "Mobile Developer",
      authorAvatar: newUsers[4].avatar,
      text: "React Native vs Flutter - cuộc chiến không hồi kết. Team RN here!",
      feeling: "🤔 Suy nghĩ",
      likes: randomInt(22, 55),
      comments: randomInt(8, 20),
      shares: randomInt(3, 10),
      createdAt: randomPastDate(4),
    },
    {
      authorId: newUsers[4].id,
      authorName: "Dương Võ",
      authorSubtitle: "Mobile Developer",
      authorAvatar: newUsers[4].avatar,
      text: "Mobile app UI design trends 2024 - rounded corners và glassmorphism đang lên ngôi!",
      imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
      likes: randomInt(38, 95),
      comments: randomInt(10, 28),
      shares: randomInt(6, 15),
      createdAt: randomPastDate(2),
    },
  ];

  await Post.insertMany(seedPosts, { ordered: false });
  console.log("Inserted seed posts:", seedPosts.length);

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

