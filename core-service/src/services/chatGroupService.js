const chatGroupRepository = require("../repositories/chatGroupRepository");

async function createGroup(payload) {
  const { name, description, ownerId, ownerName, members: initialMembers } = payload || {};
  if (!name || !ownerId || !ownerName) {
    const err = new Error("name, ownerId và ownerName là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const members = [{ userId: String(ownerId), displayName: ownerName }];
  if (Array.isArray(initialMembers) && initialMembers.length > 0) {
    const ownerUid = String(ownerId);
    for (const m of initialMembers) {
      const uid = m?.userId || m?.id;
      const displayName = m?.displayName || m?.name || "User";
      if (uid && uid !== ownerUid && !members.some((x) => x.userId === String(uid))) {
        members.push({ userId: String(uid), displayName });
      }
    }
  }
  return chatGroupRepository.create({
    name: name.trim(),
    description: description || "",
    ownerId: String(ownerId),
    members,
  });
}

async function getById(id) {
  return chatGroupRepository.findById(id);
}

async function getMyGroups(userId) {
  if (!userId) {
    const err = new Error("userId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return chatGroupRepository.findByMember(userId);
}

async function addMember(groupId, payload) {
  const { userId, displayName } = payload || {};
  if (!userId || !displayName) {
    const err = new Error("userId và displayName là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return chatGroupRepository.addMember(groupId, { userId, displayName });
}

async function removeMember(groupId, userId) {
  return chatGroupRepository.removeMember(groupId, userId);
}

async function leaveGroup(groupId, userId) {
  if (!userId) {
    const err = new Error("userId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const group = await chatGroupRepository.findById(groupId);
  if (!group) return null;
  if (String(group.ownerId) === String(userId)) {
    const err = new Error("Chủ nhóm không thể rời. Hãy chuyển quyền hoặc xóa nhóm.");
    err.statusCode = 400;
    throw err;
  }
  return chatGroupRepository.leaveGroup(groupId, userId);
}

module.exports = {
  createGroup,
  getById,
  getMyGroups,
  addMember,
  removeMember,
  leaveGroup,
};
