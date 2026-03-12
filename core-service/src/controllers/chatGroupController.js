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

async function removeMember(req, res, next) {
  try {
    const { memberId } = req.params;
    const group = await chatGroupService.removeMember(req.params.id, memberId);
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

module.exports = {
  createGroup,
  getGroupById,
  getMyGroups,
  addMember,
  removeMember,
  leaveGroup,
};
