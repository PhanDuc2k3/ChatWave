const chatService = require("../services/chatService");
const conversationService = require("../services/conversationService");

async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId);
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { conversationId } = req.params;
    const message = await chatService.sendMessage(conversationId, req.body);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}

async function getConversations(req, res, next) {
  try {
    const { userId } = req.query;
    const items = await conversationService.getConversations(userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMessages,
  sendMessage,
  getConversations,
};

