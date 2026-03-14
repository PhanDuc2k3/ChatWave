const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

router.post("/chat/completions", chatController.createCompletion);
router.post("/chat/create-tasks", chatController.createTasksFromChat);

module.exports = router;
