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
    const group = await groupService.updateMemberRole(
      req.params.id,
      req.params.memberId,
      req.body.role
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
    const group = await groupService.removeMember(
      req.params.id,
      req.params.memberId
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
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
};

