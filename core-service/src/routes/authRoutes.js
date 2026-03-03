const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", authController.register);

// POST /api/v1/auth/login
router.post("/login", authController.login);

module.exports = router;

