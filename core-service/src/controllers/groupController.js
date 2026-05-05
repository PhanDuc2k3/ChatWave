const groupService = require("../services/groupService");

async function createGroup(req, res, next) {
  try {
    const group = await groupService.createGroup(req.body);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

async function getGroupById(req, res, next) {
  try {
    const group = await groupService.getGroupById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function getMyGroups(req, res, next) {
  try {
    const { userId } = req.query;
    const groups = await groupService.getGroupsForUser(userId);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

async function searchGroups(req, res, next) {
  try {
    const { q } = req.query;
    const groups = await groupService.searchGroups(q);
    const normalized = groups.map((g) => ({
      ...g,
      id: g._id?.toString() || g.id,
    }));
    res.json(normalized);
  } catch (err) {
    next(err);
  }
}

async function getDiscoverableGroups(req, res, next) {
  try {
    const { userId } = req.query;
    const groups = await groupService.getDiscoverableGroups(userId);
    const normalized = groups.map((g) => ({
      ...g,
      id: g._id?.toString() || g.id,
    }));
    res.json(normalized);
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const group = await groupService.addMember(req.params.id, req.body);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function updateMemberRole(req, res, next) {
  try {
    const callerId = req.user?.id;
    if (!callerId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const group = await groupService.updateMemberRole(
      req.params.id,
      req.params.memberId,
      req.body.role,
      callerId
    );
    if (!group) {
      return res.status(404).json({ message: "Group or member not found" });
    }
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const callerId = req.user?.id;
    if (!callerId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const group = await groupService.removeMember(
      req.params.id,
      req.params.memberId,
      callerId
    );
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function leaveGroup(req, res, next) {
  try {
    const callerId = req.user?.id;
    if (!callerId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const group = await groupService.leaveGroup(
      req.params.id,
      callerId
    );
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function getPendingJoinRequests(req, res, next) {
  try {
    const list = await groupService.getPendingJoinRequests(req.params.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function getMyJoinRequest(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const request = await groupService.getMyJoinRequest(req.params.id, userId);
    res.json(request || null);
  } catch (err) {
    next(err);
  }
}

async function approveJoinRequest(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const { id: groupId, requestId } = req.params;
    const group = await groupService.approveJoinRequest(requestId, userId, groupId);
    if (!group) return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function rejectJoinRequest(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    await groupService.rejectJoinRequest(req.params.requestId, userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateVisibility(req, res, next) {
  try {
    const { visibility } = req.body || {};
    const userId = req.body?.userId || req.query?.userId;
    if (!visibility || !["public", "private"].includes(visibility)) {
      return res.status(400).json({ message: "visibility phải là public hoặc private" });
    }
    const group = await groupService.updateVisibility(
      req.params.id,
      visibility,
      userId
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function transferLeadership(req, res, next) {
  try {
    const callerId = req.user?.id;
    if (!callerId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const { newLeaderId } = req.body;
    if (!newLeaderId) {
      return res.status(400).json({ message: "newLeaderId là bắt buộc" });
    }
    const group = await groupService.transferLeadership(
      req.params.id,
      newLeaderId,
      callerId
    );
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json({ success: true, group });
  } catch (err) {
    next(err);
  }
}

async function deleteGroup(req, res, next) {
  try {
    const callerId = req.user?.id;
    if (!callerId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const result = await groupService.deleteGroup(req.params.id, callerId);
    if (!result) return res.status(404).json({ message: "Group not found" });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createGroup,
  getGroupById,
  getMyGroups,
  searchGroups,
  getDiscoverableGroups,
  addMember,
  getPendingJoinRequests,
  getMyJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  updateMemberRole,
  removeMember,
  leaveGroup,
  updateVisibility,
  transferLeadership,
  deleteGroup,
};

