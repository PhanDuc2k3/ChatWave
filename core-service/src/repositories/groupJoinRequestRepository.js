const GroupJoinRequest = require("../models/GroupJoinRequest");

function toId(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  if (o._id && !o.id) o.id = o._id;
  return o;
}

async function create(data) {
  const r = await GroupJoinRequest.create(data);
  return toId(r);
}

async function findPendingByGroup(groupId) {
  const list = await GroupJoinRequest.find({ groupId, status: "pending" })
    .sort({ createdAt: -1 })
    .lean();
  return list.map((d) => ({ ...d, id: d._id }));
}

async function findPendingByUser(userId) {
  const list = await GroupJoinRequest.find({ userId: String(userId), status: "pending" })
    .sort({ createdAt: -1 })
    .lean();
  return list.map((d) => ({ ...d, id: d._id }));
}

async function findById(id) {
  const r = await GroupJoinRequest.findById(id).lean();
  return r ? { ...r, id: r._id } : null;
}

async function updateStatus(id, status, reviewedBy) {
  const r = await GroupJoinRequest.findByIdAndUpdate(
    id,
    { status, reviewedBy: String(reviewedBy), reviewedAt: new Date() },
    { new: true }
  ).lean();
  return r ? { ...r, id: r._id } : null;
}

async function findByUserAndGroup(userId, groupId) {
  return GroupJoinRequest.findOne({
    userId: String(userId),
    groupId,
    status: "pending",
  }).lean();
}

module.exports = {
  create,
  findPendingByGroup,
  findPendingByUser,
  findById,
  updateStatus,
  findByUserAndGroup,
};
