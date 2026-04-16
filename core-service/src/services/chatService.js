const chatRepository = require("../repositories/chatRepository");

async function getMessages(conversationId, { before, limit } = {}) {
  if (!conversationId) {
    const err = new Error("conversationId is required");
    err.statusCode = 400;
    throw err;
  }
  return chatRepository.getMessagesByConversation(String(conversationId), {
    before,
    limit,
  });
}

async function sendMessage(conversationId, payload) {
  if (!conversationId) {
    const err = new Error("conversationId is required");
    err.statusCode = 400;
    throw err;
  }
  if (!payload.senderId || (!payload.text && !payload.imageUrl)) {
    const err = new Error("senderId and (text or imageUrl) are required");
    err.statusCode = 400;
    throw err;
  }

  const message = await chatRepository.addMessage({
    conversationId: String(conversationId),
    senderId: String(payload.senderId),
    senderName: payload.senderName || "User",
    conversationName: payload.conversationName || null,
    text: payload.text || "",
    imageUrl: payload.imageUrl || null,
  });

  return message;
}

async function getMedia(conversationId) {
  if (!conversationId) {
    const err = new Error("conversationId is required");
    err.statusCode = 400;
    throw err;
  }
  return chatRepository.getMediaByConversation(String(conversationId));
}

async function getFiles(conversationId) {
  if (!conversationId) {
    const err = new Error("conversationId is required");
    err.statusCode = 400;
    throw err;
  }
  return chatRepository.getFilesByConversation(String(conversationId));
}

module.exports = {
  getMessages,
  sendMessage,
  getMedia,
  getFiles,
};

