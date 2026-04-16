const ChatbotSession = require("../models/ChatbotSession");
const ChatbotMessage = require("../models/ChatbotMessage");

function toId(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : doc;
  if (o._id && !o.id) o.id = o._id;
  return o;
}
function toIdList(arr) {
  return (arr || []).map((d) => {
    const o = { ...d };
    if (o._id && !o.id) o.id = o._id;
    return o;
  });
}

async function createSession(data) {
  const s = await ChatbotSession.create(data);
  return toId(s);
}

async function findByUserId(userId) {
  const list = await ChatbotSession.find({ userId: String(userId) })
    .sort({ updatedAt: -1 })
    .lean();
  return toIdList(list);
}

async function findSessionById(id) {
  const s = await ChatbotSession.findById(id).lean();
  return s ? toIdList([s])[0] : null;
}

async function updateSession(id, data) {
  const s = await ChatbotSession.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  return s ? toIdList([s])[0] : null;
}

async function deleteSession(id) {
  const res = await ChatbotSession.findByIdAndDelete(id);
  if (res) {
    await ChatbotMessage.deleteMany({ sessionId: id });
  }
  return !!res;
}

async function createMessage(data) {
  const m = await ChatbotMessage.create(data);
  return toId(m);
}

async function findMessagesBySessionId(sessionId) {
  const list = await ChatbotMessage.find({ sessionId }).sort({ createdAt: 1 }).lean();
  return toIdList(list);
}

module.exports = {
  createSession,
  findByUserId,
  findSessionById,
  updateSession,
  deleteSession,
  createMessage,
  findMessagesBySessionId,
};
