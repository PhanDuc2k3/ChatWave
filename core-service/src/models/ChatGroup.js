const mongoose = require("mongoose");

// Role system: Chỉ có 2 roles - leader (1 người/nhóm) và member
// Leader có thể chuyển giao quyền cho member khác
const chatMemberSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["leader", "member"],
      default: "member",
    },
  },
  { _id: false }
);

const chatGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    ownerId: { type: String, required: true },
    avatar: { type: String, default: null },
    members: { type: [chatMemberSchema], default: [] },
  },
  { timestamps: true }
);

function normalize(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

chatGroupSchema.set("toJSON", { transform: normalize });
chatGroupSchema.set("toObject", { transform: normalize });

const ChatGroup = mongoose.model("ChatGroup", chatGroupSchema);
module.exports = ChatGroup;
