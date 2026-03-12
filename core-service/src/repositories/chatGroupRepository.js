const ChatGroup = require("../models/ChatGroup");

async function create(data) {
  const group = await ChatGroup.create(data);
  return group.toObject();
}

async function findById(id) {
  const g = await ChatGroup.findById(id).lean();
  return g || null;
}

async function findByMember(userId) {
  const groups = await ChatGroup.find({
    "members.userId": String(userId),
  })
    .lean()
    .sort({ updatedAt: -1 });
  return groups;
}

async function addMember(groupId, member) {
  const group = await ChatGroup.findById(groupId);
  if (!group) return null;
  const exists = group.members.some((m) => m.userId === String(member.userId));
  if (!exists) {
    group.members.push({
      userId: String(member.userId),
      displayName: member.displayName,
    });
    await group.save();
  }
  return group.toObject();
}

async function removeMember(groupId, userId) {
  const group = await ChatGroup.findById(groupId);
  if (!group) return null;
  const uid = String(userId);
  if (group.ownerId === uid) return null; // owner cannot remove self
  group.members = group.members.filter((m) => m.userId !== uid);
  await group.save();
  return group.toObject();
}

async function leaveGroup(groupId, userId) {
  const group = await ChatGroup.findById(groupId);
  if (!group) return null;
  const uid = String(userId);
  if (group.ownerId === uid) return null; // owner cannot leave (must transfer or delete)
  group.members = group.members.filter((m) => m.userId !== uid);
  await group.save();
  return group.toObject();
}

module.exports = {
  create,
  findById,
  findByMember,
  addMember,
  removeMember,
  leaveGroup,
};
