const chatbotSessionService = require("../services/chatbotSessionService");

async function createSession(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const title = req.body?.title || "Cuộc hội thoại mới";
    const session = await chatbotSessionService.createSession(userId, title);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

async function getSessions(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const sessions = await chatbotSessionService.getSessionsByUserId(userId);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

async function getSessionById(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const session = await chatbotSessionService.getSessionById(req.params.id, userId);
    if (!session) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function updateSession(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const session = await chatbotSessionService.updateSession(
      req.params.id,
      userId,
      { title: req.body?.title }
    );
    if (!session) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const ok = await chatbotSessionService.deleteSession(req.params.id, userId);
    if (!ok) return res.status(404).json({ message: "Không tìm thấy" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const messages = await chatbotSessionService.getMessages(req.params.id, userId);
    if (messages === null) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function addMessage(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const { role, content } = req.body || {};
    if (!role || !["user", "assistant", "system"].includes(role)) {
      return res.status(400).json({ message: "role phải là user, assistant hoặc system" });
    }
    const msg = await chatbotSessionService.addMessage(
      req.params.id,
      userId,
      role,
      content ?? ""
    );
    if (!msg) return res.status(404).json({ message: "Không tìm thấy session" });
    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getMessages,
  addMessage,
};
