const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");

async function getConversations(currentUserId) {
  const pipeline = [
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

  let userMap = {};
  const hasCurrentUser = !!currentUserId;

  if (hasCurrentUser) {
    const userIds = new Set();

    for (const item of results) {
      const idStr = String(item._id);
      if (idStr.startsWith("direct:")) {
        const parts = idStr.split(":"); // direct:userA:userB
        if (parts.length === 3) {
          const [, u1, u2] = parts;
          userIds.add(u1);
          userIds.add(u2);
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
          u.username || u.email || "User",
        ])
      );
    }
  }

  return results.map((item) => {
    const last = item.lastMessage;
    const idStr = String(item._id);

    let name;

    if (hasCurrentUser && idStr.startsWith("direct:")) {
      const parts = idStr.split(":"); // direct:userA:userB
      if (parts.length === 3) {
        const [, u1, u2] = parts;
        const me = String(currentUserId);
        const otherId = me === String(u1) ? u2 : u1;
        const otherName = userMap[otherId];

        if (otherName) {
          name = otherName;
        }
      }
    }

    if (!name) {
      name =
        last.conversationName ||
        last.senderName ||
        `Cuộc trò chuyện ${item._id}`;
    }

    return {
      id: item._id,
      name,
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

