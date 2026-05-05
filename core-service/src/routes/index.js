const express = require("express");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const postRoutes = require("./postRoutes");
const chatRoutes = require("./chatRoutes");
const groupRoutes = require("./groupRoutes");
const chatGroupRoutes = require("./chatGroupRoutes");
const taskRoutes = require("./taskRoutes");
const uploadRoutes = require("./uploadRoutes");
const friendRoutes = require("./friendRoutes");
const chatbotSessionRoutes = require("./chatbotSessionRoutes");
const notificationRoutes = require("./notificationRoutes");
const aiRoutes = require("./aiRoutes");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Health check endpoint (public, no auth required)
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/users", requireAuth, userRoutes);
// Bài viết: cho phép khách xem, nhưng bắt buộc đăng nhập cho các thao tác ghi (được cấu hình trong postRoutes)
router.use("/posts", postRoutes);
router.use("/chats", requireAuth, chatRoutes);
router.use("/groups", requireAuth, groupRoutes);
router.use("/chat-groups", requireAuth, chatGroupRoutes);
router.use("/tasks", requireAuth, taskRoutes);
router.use("/upload", requireAuth, uploadRoutes);
router.use("/friends", requireAuth, friendRoutes);
router.use("/chatbot-sessions", requireAuth, chatbotSessionRoutes);
router.use("/notifications", requireAuth, notificationRoutes);
router.use("/ai", aiRoutes);

module.exports = router;

