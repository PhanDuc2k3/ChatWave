const chatbotSessionRepo = require("../repositories/chatbotSessionRepository");

async function createSession(userId, title = "Cuộc hội thoại mới") {
  return chatbotSessionRepo.createSession({
    userId: String(userId),
    title: String(title).trim() || "Cuộc hội thoại mới",
  });
}

async function getSessionsByUserId(userId) {
  return chatbotSessionRepo.findByUserId(userId);
}

async function getSessionById(id, userId) {
  const s = await chatbotSessionRepo.findSessionById(id);
  if (!s || String(s.userId) !== String(userId)) return null;
  return s;
}

async function updateSession(id, userId, data) {
  const s = await chatbotSessionRepo.findSessionById(id);
  if (!s || String(s.userId) !== String(userId)) return null;
  return chatbotSessionRepo.updateSession(id, data);
}

async function deleteSession(id, userId) {
  const s = await chatbotSessionRepo.findSessionById(id);
  if (!s || String(s.userId) !== String(userId)) return null;
  return chatbotSessionRepo.deleteSession(id);
}

async function getMessages(sessionId, userId) {
  const s = await chatbotSessionRepo.findSessionById(sessionId);
  if (!s || String(s.userId) !== String(userId)) return null;
  return chatbotSessionRepo.findMessagesBySessionId(sessionId);
}

async function addMessage(sessionId, userId, role, content) {
  const s = await chatbotSessionRepo.findSessionById(sessionId);
  if (!s || String(s.userId) !== String(userId)) return null;
  const msg = await chatbotSessionRepo.createMessage({
    sessionId,
    role,
    content: String(content || ""),
  });
  const updates = { updatedAt: new Date() };
  if (role === "user") {
    const messages = await chatbotSessionRepo.findMessagesBySessionId(sessionId);
    const userCount = messages.filter((m) => m.role === "user").length;
    if (userCount === 1) {
      updates.title = String(content || "").slice(0, 50).trim() || "Cuộc hội thoại mới";
    }
  }
  await chatbotSessionRepo.updateSession(sessionId, updates);
  return msg;
}

module.exports = {
  createSession,
  getSessionsByUserId,
  getSessionById,
  updateSession,
  deleteSession,
  getMessages,
  addMessage,
};
