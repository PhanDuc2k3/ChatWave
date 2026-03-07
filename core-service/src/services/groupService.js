const groupRepository = require("../repositories/groupRepository");

async function createGroup(payload) {
  const { name, description, ownerId, ownerName } = payload || {};

  if (!name || !ownerId || !ownerName) {
    const err = new Error("name, ownerId và ownerName là bắt buộc");
    err.statusCode = 400;
    throw err;
  }

  const group = await groupRepository.createGroup({
    name: name.trim(),
    description: description || "",
    ownerId: String(ownerId),
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

async function getGroupsForUser(userId) {
  if (!userId) {
    const err = new Error("userId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return groupRepository.findByMember(userId);
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

module.exports = {
  createGroup,
  getGroupById,
  getGroupsForUser,
  addMember,
  updateMemberRole,
  removeMember,
};

