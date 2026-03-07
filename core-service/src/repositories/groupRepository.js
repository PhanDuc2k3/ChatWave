const Group = require("../models/Group");

async function createGroup(data) {
  const group = await Group.create(data);
  return group.toObject();
}

async function findById(id) {
  const group = await Group.findById(id).lean();
  return group || null;
}

async function findByMember(userId) {
  return Group.find({ "members.userId": String(userId) }).lean();
}

async function addMember(groupId, member) {
  const group = await Group.findById(groupId);
  if (!group) return null;

  const exists = group.members.some(
    (m) => m.userId === String(member.userId)
  );
  if (!exists) {
    group.members.push({
      userId: String(member.userId),
      displayName: member.displayName,
      role: member.role || "member",
    });
    await group.save();
  }
  return group.toObject();
}

async function updateMemberRole(groupId, userId, role) {
  const group = await Group.findById(groupId);
  if (!group) return null;
  const member = group.members.find((m) => m.userId === String(userId));
  if (!member) return null;
  member.role = role;
  await group.save();
  return group.toObject();
}

async function removeMember(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) return null;
  group.members = group.members.filter((m) => m.userId !== String(userId));
  await group.save();
  return group.toObject();
}

module.exports = {
  createGroup,
  findById,
  findByMember,
  addMember,
  updateMemberRole,
  removeMember,
};

