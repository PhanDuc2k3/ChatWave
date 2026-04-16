const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    conversationName: {
      type: String,
      default: null,
      trim: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    isDeleted: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

function normalize(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

chatMessageSchema.set("toJSON", { transform: normalize });
chatMessageSchema.set("toObject", { transform: normalize });

// Tối ưu truy vấn theo cuộc trò chuyện + thời gian
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;

