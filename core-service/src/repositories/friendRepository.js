const Friendship = require("../models/Friendship");
const User = require("../models/User");

function normalizePair(userId1, userId2) {
  const a = String(userId1);
  const b = String(userId2);
  return a < b ? [a, b] : [b, a];
}

async function findBetween(userId1, userId2) {
  const [userA, userB] = normalizePair(userId1, userId2);
  // Trả về document Mongoose để có getter id
  return Friendship.findOne({ userA, userB });
}

async function createRequest(fromUserId, toUserId) {
  const [userA, userB] = normalizePair(fromUserId, toUserId);
  const existing = await Friendship.findOne({ userA, userB });
  if (existing) return existing.toObject();

  const fr = await Friendship.create({
    userA,
    userB,
    requesterId: String(fromUserId),
    status: "pending",
  });
  return fr.toObject();
}

async function updateStatus(id, status) {
  const fr = await Friendship.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).lean();
  return fr;
}

async function remove(id) {
  const res = await Friendship.findByIdAndDelete(id);
  return !!res;
}

async function getFriendsForUser(userId) {
  const uid = String(userId);
  const docs = await Friendship.find({
    status: "accepted",
    $or: [{ userA: uid }, { userB: uid }],
  }).lean();

  const otherIds = docs.map((f) =>
    f.userA === uid ? f.userB : f.userA
  );
  if (!otherIds.length) return [];

  const users = await User.find({ _id: { $in: otherIds } }).lean();
  const userMap = Object.fromEntries(
    users.map((u) => [String(u._id), u])
  );

  return otherIds
    .map((id) => userMap[id])
    .filter(Boolean)
    .map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      avatar: u.avatar || null,
    }));
}

async function getRequestsForUser(userId) {
  const uid = String(userId);
  const docs = await Friendship.find({
    status: "pending",
    $or: [{ userA: uid }, { userB: uid }],
  }).lean();

  const incoming = [];
  const outgoing = [];

  for (const fr of docs) {
    const otherId = fr.userA === uid ? fr.userB : fr.userA;
    const user = await User.findById(otherId).lean();
    const item = {
      id: fr._id.toString(),
      otherUserId: otherId,
      otherUserName: user?.username || user?.email || "User",
      avatar: user?.avatar || null,
      createdAt: fr.createdAt,
      direction: fr.requesterId === uid ? "outgoing" : "incoming",
    };
    if (item.direction === "incoming") incoming.push(item);
    else outgoing.push(item);
  }

  return { incoming, outgoing };
}

async function findBlockedBetween(userId1, userId2) {
  const [userA, userB] = normalizePair(userId1, userId2);
  return Friendship.findOne({ userA, userB, status: "blocked" }).lean();
}

async function blockUser(userId, targetId) {
  const [userA, userB] = normalizePair(userId, targetId);
  const existing = await Friendship.findOne({ userA, userB });
  if (existing) {
    await Friendship.findByIdAndUpdate(existing._id, {
      $set: { status: "blocked", requesterId: String(userId) },
    });
  } else {
    await Friendship.create({
      userA,
      userB,
      requesterId: String(userId),
      status: "blocked",
    });
  }
  return true;
}

async function unblockUser(userId, targetId) {
  const [userA, userB] = normalizePair(userId, targetId);
  const existing = await Friendship.findOne({ userA, userB, status: "blocked" });
  if (!existing || String(existing.requesterId) !== String(userId)) return false;
  await Friendship.findByIdAndDelete(existing._id);
  return true;
}

async function getSuggestions(userId, limit = 10) {
  const uid = String(userId);
  // Lấy tất cả friendship liên quan để loại trừ
  const frs = await Friendship.find({
    $or: [{ userA: uid }, { userB: uid }],
  }).lean();

  const excluded = new Set([uid]);
  frs.forEach((fr) => {
    excluded.add(fr.userA);
    excluded.add(fr.userB);
  });

  const candidates = await User.find({
    _id: { $nin: Array.from(excluded) },
  })
    .limit(limit * 3)
    .lean();

  // TODO: có thể thêm tính mutual friends/groups sau
  return candidates.slice(0, limit).map((u) => ({
    id: u._id.toString(),
    username: u.username,
    email: u.email,
    avatar: u.avatar || null,
    mutualCount: 0,
  }));
}

module.exports = {
  normalizePair,
  findBetween,
  findBlockedBetween,
  createRequest,
  updateStatus,
  remove,
  blockUser,
  unblockUser,
  getFriendsForUser,
  getRequestsForUser,
  getSuggestions,
};

