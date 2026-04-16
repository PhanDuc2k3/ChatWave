const chatGroupRepository = require("../repositories/chatGroupRepository");

async function createGroup(payload) {
  const { name, description, ownerId, ownerName, members: initialMembers } = payload || {};
  if (!name || !ownerId || !ownerName) {
    const err = new Error("name, ownerId và ownerName là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  // Owner là leader đầu tiên
  const members = [{ userId: String(ownerId), displayName: ownerName, role: "leader" }];
  if (Array.isArray(initialMembers) && initialMembers.length > 0) {
    const ownerUid = String(ownerId);
    for (const m of initialMembers) {
      const uid = m?.userId || m?.id;
      const displayName = m?.displayName || m?.name || "User";
      if (uid && uid !== ownerUid && !members.some((x) => x.userId === String(uid))) {
        members.push({ userId: String(uid), displayName, role: "member" });
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

async function updateMemberRole(groupId, memberUserId, newRole, callerUserId) {
  if (!["leader", "member"].includes(newRole)) {
    const err = new Error("Invalid role. Use leader or member.");
    err.statusCode = 400;
    throw err;
  }
  const group = await chatGroupRepository.findById(groupId);
  if (!group) return null;

  // Kiểm tra caller có quyền không (chỉ leader được thay đổi role)
  const caller = group.members?.find((m) => m.userId === String(callerUserId));
  if (!caller || caller.role !== "leader") {
    const err = new Error("Only leader can change roles.");
    err.statusCode = 403;
    throw err;
  }

  const target = group.members?.find((m) => m.userId === String(memberUserId));
  if (!target) return null;

  // Không thể thay đổi role của chính mình
  if (target.userId === String(callerUserId)) {
    const err = new Error("Cannot change your own role.");
    err.statusCode = 400;
    throw err;
  }

  // Nếu đang thăng lên leader: kiểm tra đã có leader chưa
  if (newRole === "leader") {
    const existingLeader = group.members?.find((m) => m.role === "leader");
    if (existingLeader) {
      const err = new Error("Group already has a leader. Transfer leadership first if needed.");
      err.statusCode = 400;
      throw err;
    }
  }

  return chatGroupRepository.updateMemberRole(groupId, memberUserId, newRole);
}

// Chuyển giao quyền leader cho member khác
async function transferLeadership(groupId, newLeaderId, callerUserId) {
  const group = await chatGroupRepository.findById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  // Chỉ leader hiện tại có thể chuyển giao
  const caller = group.members?.find((m) => m.userId === String(callerUserId));
  if (!caller || caller.role !== "leader") {
    const err = new Error("Only current leader can transfer leadership.");
    err.statusCode = 403;
    throw err;
  }

  // Tìm member mới
  const newLeader = group.members?.find((m) => m.userId === String(newLeaderId) && m.role === "member");
  if (!newLeader) {
    const err = new Error("Target user must be a member of the group.");
    err.statusCode = 404;
    throw err;
  }

  // Chuyển role của caller từ leader → member
  // Chuyển role của newLeader từ member → leader
  await chatGroupRepository.updateMemberRole(groupId, callerUserId, "member");
  await chatGroupRepository.updateMemberRole(groupId, newLeaderId, "leader");

  const updatedGroup = await chatGroupRepository.findById(groupId);
  return updatedGroup;
}

async function deleteGroup(groupId, callerUserId) {
  const group = await chatGroupRepository.findById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  // Chỉ leader được xóa nhóm
  const caller = group.members?.find((m) => m.userId === String(callerUserId));
  if (!caller || caller.role !== "leader") {
    const err = new Error("Only leader can delete the group.");
    err.statusCode = 403;
    throw err;
  }

  // Xóa tất cả messages, notifications liên quan (có thể cần cleanup thêm)
  // TODO: Cleanup messages, notifications khi xóa group

  await chatGroupRepository.deleteGroup(groupId);
  return { success: true, message: "Group deleted" };
}

async function updateAvatar(groupId, avatarUrl, callerUserId) {
  if (!avatarUrl) {
    const err = new Error("avatarUrl là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const group = await chatGroupRepository.findById(groupId);
  if (!group) return null;

  const member = group.members?.find((m) => m.userId === String(callerUserId));
  if (!member) {
    const err = new Error("Bạn không phải thành viên của nhóm này.");
    err.statusCode = 403;
    throw err;
  }

  return chatGroupRepository.updateAvatar(groupId, avatarUrl);
}

async function removeMember(groupId, userId, callerUserId) {
  const group = await chatGroupRepository.findById(groupId);
  if (!group) return null;
  
  // Chỉ leader được xóa member
  const caller = group.members?.find((m) => m.userId === String(callerUserId));
  if (!caller || caller.role !== "leader") {
    const err = new Error("Only leader can remove members.");
    err.statusCode = 403;
    throw err;
  }
  
  const target = group.members?.find((m) => m.userId === String(userId));
  if (!target) return null;
  
  // Leader không thể tự xóa mình qua endpoint này (phải dùng leaveGroup sau khi chuyển quyền)
  if (target.role === "leader") {
    const err = new Error("Leader cannot be removed. Use transfer leadership first.");
    err.statusCode = 400;
    throw err;
  }
  
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
  
  const member = group.members?.find((m) => m.userId === String(userId));
  if (!member) {
    const err = new Error("User không phải là thành viên");
    err.statusCode = 404;
    throw err;
  }
  
  // Leader không thể leave trừ khi chuyển quyền trước
  if (member.role === "leader") {
    const err = new Error("Leader không thể rời nhóm. Hãy chuyển giao quyền trước.");
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
  updateMemberRole,
  removeMember,
  leaveGroup,
  transferLeadership,
  deleteGroup,
  updateAvatar,
};
