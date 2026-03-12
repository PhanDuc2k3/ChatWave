const friendService = require("../services/friendService");

async function getFriends(req, res, next) {
  try {
    const { userId } = req.query;
    const friends = await friendService.getFriends(userId);
    res.json(friends);
  } catch (err) {
    next(err);
  }
}

async function getRequests(req, res, next) {
  try {
    const { userId } = req.query;
    const result = await friendService.getRequests(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function sendRequest(req, res, next) {
  try {
    const { fromUserId, toUserId } = req.body || {};
    const fr = await friendService.sendRequest(fromUserId, toUserId);
    res.status(201).json(fr);
  } catch (err) {
    next(err);
  }
}

async function respondRequest(req, res, next) {
  try {
    const { userId, action } = req.body || {};
    const { id } = req.params;
    const fr = await friendService.respondRequest(userId, id, action);
    res.json(fr);
  } catch (err) {
    next(err);
  }
}

async function removeFriend(req, res, next) {
  try {
    const { userId, targetId } = req.query;
    const ok = await friendService.removeFriend(userId, targetId);
    if (!ok) {
      return res.status(404).json({ message: "Friendship not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getSuggestions(req, res, next) {
  try {
    const { userId } = req.query;
    const items = await friendService.getSuggestions(userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function blockUser(req, res, next) {
  try {
    const { userId, targetId } = req.body || {};
    await friendService.blockUser(userId, targetId);
    res.json({ message: "Đã chặn người dùng" });
  } catch (err) {
    next(err);
  }
}

async function unblockUser(req, res, next) {
  try {
    const { userId, targetId } = req.body || {};
    await friendService.unblockUser(userId, targetId);
    res.json({ message: "Đã bỏ chặn người dùng" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFriends,
  getRequests,
  sendRequest,
  respondRequest,
  removeFriend,
  getSuggestions,
  blockUser,
  unblockUser,
};

