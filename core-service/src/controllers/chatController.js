const chatService = require("../services/chatService");
const conversationService = require("../services/conversationService");

async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { before, limit } = req.query;
    const result = await chatService.getMessages(conversationId, {
      before,
      limit,
    });
    res.json(result);
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
    // Disable cache
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    const { userId } = req.query;
    const items = await conversationService.getConversations(userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function getMedia(req, res, next) {
  try {
    const { conversationId } = req.params;
    const items = await chatService.getMedia(conversationId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function getFiles(req, res, next) {
  try {
    const { conversationId } = req.params;
    const items = await chatService.getFiles(conversationId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function getOrCreateConversation(req, res, next) {
  try {
    const { targetUserId } = req.query;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversation = await conversationService.getOrCreateConversation(currentUserId, targetUserId);
    res.json(conversation);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMessages,
  sendMessage,
  getConversations,
  getOrCreateConversation,
  getMedia,
  getFiles,
};

