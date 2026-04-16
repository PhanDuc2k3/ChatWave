const ChatMessage = require("../models/ChatMessage");
const ChatGroup = require("../models/ChatGroup");
const User = require("../models/User");

async function getConversations(currentUserId) {
  if (!currentUserId) return [];

  const userIdStr = String(currentUserId);

  // Bước 1: Lấy tất cả groups user là member (1 query nhanh với index)
  const userGroups = await ChatGroup.find({
    "members.userId": userIdStr,
  }).lean();

  const userGroupIds = new Set(userGroups.map(g => String(g._id)));

  // Bước 2: Lấy tất cả messages, group theo conversationId
  // Tối ưu: Filter trước khi aggregate để giảm data xử lý
  const matchStage = {
    $match: {
      $or: [
        { conversationId: { $regex: `^direct:.*:${userIdStr}$|^direct:${userIdStr}:` } },
        { conversationId: { $in: Array.from(userGroupIds) } },
      ],
    },
  };

  const pipeline = [
    matchStage,
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: "$conversationId",
        lastMessage: { $last: "$$ROOT" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ];

  const results = await ChatMessage.aggregate(pipeline);

  // Bước 3: Build user map cho direct chat
  let userMap = {};
  const userIds = new Set();

  for (const item of results) {
    const convId = String(item._id);
    if (convId.startsWith("direct:")) {
      const parts = convId.split(":");
      if (parts.length === 3) {
        const [, u1, u2] = parts;
        if (u1 !== userIdStr) userIds.add(u1);
        if (u2 !== userIdStr) userIds.add(u2);
      }
    }
  }

  if (userIds.size > 0) {
    const users = await User.find({
      _id: { $in: Array.from(userIds) },
    }).lean();

    userMap = Object.fromEntries(
      users.map((u) => [
        String(u._id),
        {
          name: u.username || u.email || "User",
          avatar: u.avatar || null,
        },
      ])
    );
  }

  // Bước 4: Map results
    return results.map((item) => {
    const last = item.lastMessage;
    const convId = String(item._id);

    let name;
    let avatar = null;
    let userId = null;

    if (convId.startsWith("direct:")) {
      const parts = convId.split(":");
      if (parts.length === 3) {
        const [, u1, u2] = parts;
        const otherId = u1 === userIdStr ? u2 : u1;
        userId = otherId;
        const other = userMap[otherId];
        if (other) {
          name = other.name;
          avatar = other.avatar;
        }
      }
    } else {
      name = last.conversationName || `Nhóm ${convId}`;
      avatar = null;
    }

    return {
      id: convId,
      userId,
      partnerId: userId,
      name,
      avatar,
      message: last.text,
      status: "Online",
      lastActive: new Date(last.createdAt).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      }),
      messageCount: item.count,
    };
  });
}

module.exports = {
  getConversations,
};
