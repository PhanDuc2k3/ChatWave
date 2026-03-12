const friendRepository = require("../repositories/friendRepository");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");

async function sendRequest(fromUserId, toUserId) {
  if (!fromUserId || !toUserId) {
    const err = new Error("fromUserId và toUserId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  if (String(fromUserId) === String(toUserId)) {
    const err = new Error("Không thể kết bạn với chính mình");
    err.statusCode = 400;
    throw err;
  }
  const blocked = await friendRepository.findBlockedBetween(fromUserId, toUserId);
  if (blocked) {
    const err = new Error("Không thể gửi lời mời kết bạn");
    err.statusCode = 403;
    throw err;
  }
  return friendRepository.createRequest(fromUserId, toUserId);
}

async function respondRequest(userId, friendshipId, action) {
  if (!friendshipId || !action) {
    const err = new Error("friendshipId và action là bắt buộc");
    err.statusCode = 400;
    throw err;
  }

  if (action === "accept") {
    const fr = await friendRepository.updateStatus(
      friendshipId,
      "accepted"
    );

    if (fr) {
      const [userA, userB] = friendRepository.normalizePair(
        fr.userA,
        fr.userB
      );
      const users = await User.find({
        _id: { $in: [userA, userB] },
      }).lean();
      const map = Object.fromEntries(
        users.map((u) => [String(u._id), u])
      );
      const userAName =
        map[userA]?.username || map[userA]?.email || "User A";
      const userBName =
        map[userB]?.username || map[userB]?.email || "User B";

      const conversationId = `direct:${userA}:${userB}`;
      const text = `Chúc mừng ${userAName} và ${userBName} đã kết bạn trên ChatWave!`;

      await ChatMessage.create({
        conversationId,
        senderId: "system",
        senderName: "Hệ thống",
        conversationName: `${userAName} & ${userBName}`,
        text,
      });
    }

    return fr;
  }
  if (action === "decline") {
    await friendRepository.remove(friendshipId);
    return null;
  }

  const err = new Error("action không hợp lệ");
  err.statusCode = 400;
  throw err;
}

async function removeFriend(userId, targetId) {
  const fr = await friendRepository.findBetween(userId, targetId);
  if (!fr) return false;
  // fr là document Mongoose, có cả _id và getter id
  return friendRepository.remove(fr.id || fr._id?.toString());
}

async function getFriends(userId) {
  if (!userId) {
    const err = new Error("userId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return friendRepository.getFriendsForUser(userId);
}

async function getRequests(userId) {
  if (!userId) {
    const err = new Error("userId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return friendRepository.getRequestsForUser(userId);
}

async function getSuggestions(userId) {
  if (!userId) {
    const err = new Error("userId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return friendRepository.getSuggestions(userId, 10);
}

async function blockUser(userId, targetId) {
  if (!userId || !targetId) {
    const err = new Error("userId và targetId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  if (String(userId) === String(targetId)) {
    const err = new Error("Không thể chặn chính mình");
    err.statusCode = 400;
    throw err;
  }
  return friendRepository.blockUser(userId, targetId);
}

async function unblockUser(userId, targetId) {
  if (!userId || !targetId) {
    const err = new Error("userId và targetId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return friendRepository.unblockUser(userId, targetId);
}

module.exports = {
  sendRequest,
  respondRequest,
  removeFriend,
  getFriends,
  getRequests,
  getSuggestions,
  blockUser,
  unblockUser,
};

