const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", authController.register);

// POST /api/v1/auth/login
router.post("/login", authController.login);

// POST /api/v1/auth/refresh
router.post("/refresh", authController.refresh);
router.post("/change-password", authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;

