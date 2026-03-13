const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

router.post("/chat/completions", chatController.createCompletion);

module.exports = router;
