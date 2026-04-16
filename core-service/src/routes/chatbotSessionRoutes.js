const express = require("express");
const chatbotSessionController = require("../controllers/chatbotSessionController");

const router = express.Router();

router.post("/", chatbotSessionController.createSession);
router.get("/", chatbotSessionController.getSessions);
router.get("/:id", chatbotSessionController.getSessionById);
router.patch("/:id", chatbotSessionController.updateSession);
router.delete("/:id", chatbotSessionController.deleteSession);
router.get("/:id/messages", chatbotSessionController.getMessages);
router.post("/:id/messages", chatbotSessionController.addMessage);

module.exports = router;
