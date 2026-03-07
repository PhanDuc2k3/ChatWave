const ChatMessage = require("../models/ChatMessage");

async function getMessagesByConversation(conversationId) {
  return ChatMessage.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();
}

async function addMessage(data) {
  const msg = await ChatMessage.create(data);
  return msg.toObject();
}

module.exports = {
  getMessagesByConversation,
  addMessage,
};

