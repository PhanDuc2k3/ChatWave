const ChatGroup = require("../models/ChatGroup");

async function create(data) {
  const { members, ownerId, ...rest } = data;
  const withRoles = (members || []).map((m, i) => ({
    userId: String(m.userId),
    displayName: m.displayName || "User",
    role: String(ownerId) === String(m.userId) ? "leader" : (m.role || "member"),
  }));
  if (withRoles.length && !withRoles.some((m) => m.role === "leader")) {
    withRoles[0].role = "leader";
  }
  const group = await ChatGroup.create({ ...rest, ownerId, members: withRoles });
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
      role: member.role || "member",
    });
    await group.save();
  }
  return group.toObject();
}

async function updateMemberRole(groupId, userId, role) {
  const group = await ChatGroup.findById(groupId);
  if (!group) return null;
  const member = group.members.find((m) => m.userId === String(userId));
  if (!member) return null;
  member.role = role;
  await group.save();
  return group.toObject();
}

async function removeMember(groupId, userId) {
  const group = await ChatGroup.findById(groupId);
  if (!group) return null;
  const uid = String(userId);
  // Không cho xóa leader (dù là owner hay không)
  const isLeader = group.members.some((m) => m.userId === uid && m.role === "leader");
  if (isLeader) return null; // leader cannot be removed via this endpoint
  group.members = group.members.filter((m) => m.userId !== uid);
  await group.save();
  return group.toObject();
}

async function leaveGroup(groupId, userId) {
  const group = await ChatGroup.findById(groupId);
  if (!group) return null;
  const uid = String(userId);
  // Leader không thể leave trừ khi chuyển quyền trước (check ở service)
  // Ở đây chỉ cần filter
  group.members = group.members.filter((m) => m.userId !== uid);
  await group.save();
  return group.toObject();
}

async function deleteGroup(groupId) {
  const group = await ChatGroup.findById(groupId);
  if (!group) return null;
  await ChatGroup.findByIdAndDelete(groupId);
  return { success: true };
}

async function updateAvatar(groupId, avatarUrl) {
  const group = await ChatGroup.findById(groupId);
  if (!group) return null;
  group.avatar = avatarUrl;
  await group.save();
  return group.toObject();
}

module.exports = {
  create,
  findById,
  findByMember,
  addMember,
  updateMemberRole,
  removeMember,
  leaveGroup,
  deleteGroup,
  updateAvatar,
};
