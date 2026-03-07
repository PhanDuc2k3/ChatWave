const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

// GET /api/v1/chats/conversations
router.get("/conversations", chatController.getConversations);

// GET /api/v1/chats/:conversationId/messages
router.get("/:conversationId/messages", chatController.getMessages);

// POST /api/v1/chats/:conversationId/messages
router.post("/:conversationId/messages", chatController.sendMessage);

module.exports = router;

