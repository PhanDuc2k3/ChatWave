const groupRepository = require("../repositories/groupRepository");
const groupJoinRequestRepo = require("../repositories/groupJoinRequestRepository");
const Notification = require("../models/Notification");

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
        role: "leader", // owner ban đầu là leader
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
  const group = await groupRepository.findById(groupId);
  if (!group) return null;
  if (group.visibility === "private") {
    const existing = await groupJoinRequestRepo.findByUserAndGroup(userId, groupId);
    if (existing) {
      const err = new Error("Bạn đã gửi yêu cầu tham gia. Vui lòng chờ admin duyệt.");
      err.statusCode = 400;
      throw err;
    }
    const member = group.members?.find((m) => m.userId === String(userId));
    if (member) {
      return groupRepository.addMember(groupId, { userId, displayName, role });
    }
    return groupJoinRequestRepo.create({
      userId: String(userId),
      displayName,
      groupId,
      groupName: group.name || "",
      status: "pending",
    });
  }
  return groupRepository.addMember(groupId, {
    userId,
    displayName,
    role: role || "member",
  });
}

async function requestToJoin(groupId, payload) {
  return addMember(groupId, payload);
}

async function getPendingJoinRequests(groupId) {
  return groupJoinRequestRepo.findPendingByGroup(groupId);
}

async function getMyJoinRequest(groupId, userId) {
  const req = await groupJoinRequestRepo.findByUserAndGroup(userId, groupId);
  return req ? { ...req, id: req._id } : null;
}

async function approveJoinRequest(requestId, reviewerId, expectedGroupId) {
  const req = await groupJoinRequestRepo.findById(requestId);
  if (!req || req.status !== "pending") return null;
  if (expectedGroupId && String(req.groupId) !== String(expectedGroupId)) {
    const err = new Error("Yêu cầu không thuộc nhóm này");
    err.statusCode = 400;
    throw err;
  }
  const group = await groupRepository.findById(req.groupId);
  if (!group) return null;
  const reviewer = group.members?.find((m) => m.userId === String(reviewerId));
  if (!reviewer || reviewer.role !== "leader") {
    const err = new Error("Chỉ leader mới duyệt được");
    err.statusCode = 403;
    throw err;
  }
  await groupRepository.addMember(req.groupId, {
    userId: req.userId,
    displayName: req.displayName,
    role: "member",
  });
  await groupJoinRequestRepo.updateStatus(requestId, "approved", reviewerId);
  await Notification.create({
    userId: req.userId,
    type: "group_join_approved",
    title: "Tham gia nhóm thành công",
    message: `Bạn đã được duyệt vào nhóm "${req.groupName || group.name}".`,
    link: `/groups/${req.groupId}`,
    meta: { groupId: String(req.groupId), groupName: req.groupName || group.name },
  });
  return groupRepository.findById(req.groupId);
}

async function rejectJoinRequest(requestId, reviewerId) {
  const req = await groupJoinRequestRepo.findById(requestId);
  if (!req || req.status !== "pending") return null;
  const group = await groupRepository.findById(req.groupId);
  if (!group) return null;
  const reviewer = group.members?.find((m) => m.userId === String(reviewerId));
  if (!reviewer || reviewer.role !== "leader") {
    const err = new Error("Chỉ leader mới từ chối được");
    err.statusCode = 403;
    throw err;
  }
  await groupJoinRequestRepo.updateStatus(requestId, "rejected", reviewerId);
  return { success: true };
}

async function updateMemberRole(groupId, userId, role, callerUserId) {
  if (!["leader", "member"].includes(role)) {
    const err = new Error("role không hợp lệ. Dùng leader hoặc member");
    err.statusCode = 400;
    throw err;
  }
  
  const group = await groupRepository.findById(groupId);
  if (!group) return null;
  
  // Chỉ leader được thay đổi role
  const caller = group.members?.find((m) => m.userId === String(callerUserId));
  if (!caller || caller.role !== "leader") {
    const err = new Error("Only leader can change roles.");
    err.statusCode = 403;
    throw err;
  }
  
  const target = group.members?.find((m) => m.userId === String(userId));
  if (!target) return null;
  
  // Không thể thay đổi role của chính mình
  if (target.userId === String(callerUserId)) {
    const err = new Error("Cannot change your own role.");
    err.statusCode = 400;
    throw err;
  }
  
  // Nếu đang thăng lên leader: kiểm tra đã có leader chưa
  if (role === "leader") {
    const existingLeader = group.members?.find((m) => m.role === "leader");
    if (existingLeader) {
      const err = new Error("Group already has a leader. Transfer leadership first if needed.");
      err.statusCode = 400;
      throw err;
    }
  }
  
  return groupRepository.updateMemberRole(groupId, userId, role);
}

async function removeMember(groupId, userId, callerUserId) {
  const group = await groupRepository.findById(groupId);
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
  
  return groupRepository.removeMember(groupId, userId);
}

async function updateVisibility(groupId, visibility, userId) {
  const group = await groupRepository.findById(groupId);
  if (!group) return null;
  const member = group.members?.find((m) => m.userId === String(userId));
  if (!member || member.role !== "leader") {
    const err = new Error("Chỉ leader mới được thay đổi hiển thị nhóm");
    err.statusCode = 403;
    throw err;
  }
  return groupRepository.updateVisibility(groupId, visibility);
}

async function transferLeadership(groupId, newLeaderId, callerId) {
  const group = await groupRepository.findById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  // Kiểm tra caller có phải leader không
  const caller = group.members?.find((m) => m.userId === String(callerId));
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

  // Chuyển role
  await groupRepository.updateMemberRole(groupId, callerId, "member");
  await groupRepository.updateMemberRole(groupId, newLeaderId, "leader");

  // Không cập nhật ownerId - vẫn là người tạo ban đầu
  // Trong hệ thống mới, leader là người quản lý thực tế

  return groupRepository.findById(groupId);
}

async function deleteGroup(groupId, callerId) {
  const group = await groupRepository.findById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }

  // Chỉ leader được xóa nhóm
  const caller = group.members?.find((m) => m.userId === String(callerId));
  if (!caller || caller.role !== "leader") {
    const err = new Error("Only leader can delete the group.");
    err.statusCode = 403;
    throw err;
  }

  // Xóa group (cascade cleanup sẽ tự động xóa join requests, notifications, members)
  // Mongoose sẽ tự động xóa các sub-documents trong members array
  await groupRepository.deleteGroup(groupId);
  
  return { success: true, message: "Group deleted" };
}

module.exports = {
  createGroup,
  getGroupById,
  getGroupsForUser,
  getDiscoverableGroups,
  searchGroups,
  isMember,
  addMember,
  requestToJoin,
  getPendingJoinRequests,
  getMyJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  updateMemberRole,
  removeMember,
  updateVisibility,
  transferLeadership,
  deleteGroup,
};

