const Group = require("../models/Group");

async function createGroup(data) {
  const group = await Group.create(data);
  return group.toObject();
}

async function findById(id) {
  const group = await Group.findById(id).lean();
  return group || null;
}

async function isMember(groupId, userId) {
  if (!groupId || !userId) return false;
  const group = await Group.findById(groupId).select("members").lean();
  if (!group) return false;
  return group.members?.some(
    (m) => m.userId === String(userId)
  ) ?? false;
}

async function findByMember(userId) {
  const groups = await Group.find({ "members.userId": String(userId) }).lean();
  return groups;
}

async function search(query) {
  const q = String(query || "").trim();
  if (!q) return [];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const groups = await Group.find({
    $or: [{ name: regex }, { description: regex }],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return groups;
}

async function findDiscoverable(userId) {
  const uid = userId ? String(userId) : null;
  const myGroups = uid
    ? await Group.find({ "members.userId": uid }).lean()
    : [];
  const myGroupIds = myGroups.map((g) => g._id.toString());
  const publicGroups = await Group.find({ visibility: "public" }).lean();
  const publicIds = publicGroups.map((g) => g._id.toString());
  const newPublicIds = publicIds.filter((id) => !myGroupIds.includes(id));
  const newPublicGroups = publicGroups.filter((g) =>
    newPublicIds.includes(g._id.toString())
  );
  return [...myGroups, ...newPublicGroups];
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

async function updateVisibility(groupId, visibility) {
  if (!["public", "private"].includes(visibility)) return null;
  const group = await Group.findByIdAndUpdate(
    groupId,
    { visibility },
    { new: true }
  );
  return group ? group.toObject() : null;
}

module.exports = {
  createGroup,
  findById,
  findByMember,
  search,
  findDiscoverable,
  isMember,
  addMember,
  updateMemberRole,
  removeMember,
  updateVisibility,
};

