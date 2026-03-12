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

async function updateMessage(messageId, updateData) {
  const msg = await ChatMessage.findByIdAndUpdate(
    messageId,
    { $set: updateData },
    { new: true }
  ).lean();
  return msg || null;
}

async function findById(messageId) {
  const msg = await ChatMessage.findById(messageId).lean();
  return msg || null;
}

module.exports = {
  getMessagesByConversation,
  addMessage,
  updateMessage,
  findById,
};

