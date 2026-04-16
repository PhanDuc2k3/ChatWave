const chatGroupService = require("../services/chatGroupService");

async function createGroup(req, res, next) {
  try {
    const group = await chatGroupService.createGroup(req.body);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

async function getGroupById(req, res, next) {
  try {
    const group = await chatGroupService.getById(req.params.id);
    if (!group) return res.status(404).json({ message: "ChatGroup not found" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function getMyGroups(req, res, next) {
  try {
    const { userId } = req.query;
    const groups = await chatGroupService.getMyGroups(userId);
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const group = await chatGroupService.addMember(req.params.id, req.body);
    if (!group) return res.status(404).json({ message: "ChatGroup not found" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function updateMemberRole(req, res, next) {
  try {
    const callerId = req.user?.id || req.user?._id || req.userId;
    const group = await chatGroupService.updateMemberRole(
      req.params.id,
      req.params.memberId,
      req.body.role,
      callerId
    );
    if (!group) return res.status(404).json({ message: "ChatGroup not found" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const callerId = req.user?.id || req.user?._id || req.userId;
    const group = await chatGroupService.removeMember(
      req.params.id,
      req.params.memberId,
      callerId
    );
    if (!group) return res.status(404).json({ message: "ChatGroup not found" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function leaveGroup(req, res, next) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId là bắt buộc" });
    const group = await chatGroupService.leaveGroup(req.params.id, userId);
    if (!group) return res.status(404).json({ message: "ChatGroup not found" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

async function transferLeadership(req, res, next) {
  try {
    const callerId = req.user?.id || req.user?._id || req.userId;
    const { newLeaderId } = req.body;
    if (!newLeaderId) {
      return res.status(400).json({ message: "newLeaderId là bắt buộc" });
    }
    const group = await chatGroupService.transferLeadership(
      req.params.id,
      newLeaderId,
      callerId
    );
    if (!group) return res.status(404).json({ message: "ChatGroup not found" });
    res.json({ success: true, group });
  } catch (err) {
    next(err);
  }
}

async function deleteGroup(req, res, next) {
  try {
    const callerId = req.user?.id || req.user?._id || req.userId;
    const result = await chatGroupService.deleteGroup(req.params.id, callerId);
    if (!result) return res.status(404).json({ message: "ChatGroup not found" });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateAvatar(req, res, next) {
  try {
    const callerId = req.user?.id || req.user?._id || req.userId;
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ message: "avatar là bắt buộc" });
    }
    const group = await chatGroupService.updateAvatar(req.params.id, avatar, callerId);
    if (!group) return res.status(404).json({ message: "ChatGroup not found" });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createGroup,
  getGroupById,
  getMyGroups,
  addMember,
  updateMemberRole,
  removeMember,
  leaveGroup,
  transferLeadership,
  deleteGroup,
  updateAvatar,
};
