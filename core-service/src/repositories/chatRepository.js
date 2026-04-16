const ChatMessage = require("../models/ChatMessage");

async function getMessagesByConversation(conversationId, { before, limit }) {
  const safeLimit = Math.min(
    Number(limit || process.env.CHAT_MESSAGES_DEFAULT_LIMIT || 20) || 20,
    100
  );

  const query = { conversationId };

  // Cursor pagination dựa trên createdAt
  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      query.createdAt = { $lt: beforeDate };
    }
  }

  const docs = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    // chỉ lấy field tối thiểu, không populate
    .select("_id conversationId senderId text createdAt")
    .limit(safeLimit)
    .lean();

  // đảo lại cho tăng dần theo thời gian
  const chronological = docs.reverse();

  const items = chronological.map((doc) => ({
    _id: doc._id,
    content: doc.text || "",
    sender: doc.senderId,
    createdAt: doc.createdAt,
    conversationId: doc.conversationId,
  }));

  return {
    items,
    pageInfo: {
      hasMore: docs.length === safeLimit,
      nextCursor: items.length ? items[0].createdAt : null,
      count: items.length,
    },
  };
}

async function addMessage(data) {
  const msg = await ChatMessage.create(data);
  const plain = msg.toObject();
  return {
    _id: plain.id || plain._id,
    content: plain.text || "",
    sender: plain.senderId,
    createdAt: plain.createdAt,
    conversationId: plain.conversationId,
    imageUrl: plain.imageUrl || null,
  };
}

function isMediaUrl(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(url);
}

function isFileUrl(url) {
  if (!url) return false;
  if (isMediaUrl(url)) return false;
  return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|mp3|mp4|avi|mov|txt|json|csv)(\?.*)?$/i.test(url);
}

async function getMediaByConversation(conversationId) {
  const docs = await ChatMessage.find({
    conversationId,
    isDeleted: false,
    $or: [
      { imageUrl: { $ne: null, $exists: true } },
      { text: { $regex: /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return docs.map((doc) => {
    let url = doc.imageUrl;
    if (!url && doc.text) {
      const match = doc.text.match(/(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^\s]*)?)/gi);
      if (match) url = match[0];
    }
    return {
      id: doc._id,
      url,
      senderId: doc.senderId,
      senderName: doc.senderName,
      createdAt: doc.createdAt,
      conversationId: doc.conversationId,
    };
  }).filter((m) => m.url);
}

async function getFilesByConversation(conversationId) {
  const docs = await ChatMessage.find({
    conversationId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const files = [];
  docs.forEach((doc) => {
    if (doc.text) {
      const matches = doc.text.match(/(https?:\/\/[^\s]+?\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|mp3|mp4|avi|mov|txt|json|csv)(?:\?[^\s]*)?)/gi);
      if (matches) {
        matches.forEach((url) => {
          const ext = url.split(".").pop().split("?")[0].toLowerCase();
          files.push({
            id: `${doc._id}_${ext}`,
            url,
            fileName: url.split("/").pop().split("?")[0] || `file.${ext}`,
            fileType: ext,
            senderId: doc.senderId,
            senderName: doc.senderName,
            createdAt: doc.createdAt,
            conversationId: doc.conversationId,
          });
        });
      }
    }
  });

  return files;
}

module.exports = {
  getMessagesByConversation,
  addMessage,
  getMediaByConversation,
  getFilesByConversation,
};

