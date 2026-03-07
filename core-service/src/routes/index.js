const express = require("express");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const postRoutes = require("./postRoutes");
const chatRoutes = require("./chatRoutes");
const groupRoutes = require("./groupRoutes");
const friendRoutes = require("./friendRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/chats", chatRoutes);
router.use("/groups", groupRoutes);
router.use("/friends", friendRoutes);

module.exports = router;

