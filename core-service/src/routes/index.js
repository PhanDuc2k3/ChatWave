const express = require("express");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const postRoutes = require("./postRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);

module.exports = router;

