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
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

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

module.exports = router;

