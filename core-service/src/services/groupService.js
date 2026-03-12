const groupRepository = require("../repositories/groupRepository");

async function createGroup(payload) {
  const { name, description, ownerId, ownerName, visibility } = payload || {};

  if (!name || !ownerId || !ownerName) {
    const err = new Error("name, ownerId và ownerName là bắt buộc");
    err.statusCode = 400;
    throw err;
  }

  const vis = visibility === "private" ? "private" : "public";

  const group = await groupRepository.createGroup({
    name: name.trim(),
    description: description || "",
    ownerId: String(ownerId),
    visibility: vis,
    members: [
      {
        userId: String(ownerId),
        displayName: ownerName,
        role: "owner",
      },
    ],
  });

  return group;
}

async function getGroupById(id) {
  return groupRepository.findById(id);
}

async function isMember(groupId, userId) {
  return groupRepository.isMember(groupId, userId);
}

async function getGroupsForUser(userId) {
  if (!userId) {
    const err = new Error("userId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return groupRepository.findByMember(userId);
}

async function getDiscoverableGroups(userId) {
  const groups = await groupRepository.findDiscoverable(userId || null);
  return groups;
}

async function searchGroups(query) {
  return groupRepository.search(query);
}

async function addMember(groupId, payload) {
  const { userId, displayName, role } = payload || {};
  if (!userId || !displayName) {
    const err = new Error("userId và displayName là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return groupRepository.addMember(groupId, {
    userId,
    displayName,
    role: role || "member",
  });
}

async function updateMemberRole(groupId, userId, role) {
  if (!["owner", "admin", "member"].includes(role)) {
    const err = new Error("role không hợp lệ");
    err.statusCode = 400;
    throw err;
  }
  return groupRepository.updateMemberRole(groupId, userId, role);
}

async function removeMember(groupId, userId) {
  return groupRepository.removeMember(groupId, userId);
}

async function updateVisibility(groupId, visibility, userId) {
  const group = await groupRepository.findById(groupId);
  if (!group) return null;
  const member = group.members?.find((m) => m.userId === String(userId));
  if (!member || !["owner", "admin"].includes(member.role)) {
    const err = new Error("Chỉ nhóm trưởng hoặc nhóm phó mới được đổi quyền hiển thị");
    err.statusCode = 403;
    throw err;
  }
  return groupRepository.updateVisibility(groupId, visibility);
}

module.exports = {
  createGroup,
  getGroupById,
  getGroupsForUser,
  getDiscoverableGroups,
  searchGroups,
  isMember,
  addMember,
  updateMemberRole,
  removeMember,
  updateVisibility,
};

