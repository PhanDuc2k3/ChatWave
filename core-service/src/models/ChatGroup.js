const mongoose = require("mongoose");

const chatMemberSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const chatGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    ownerId: { type: String, required: true },
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
