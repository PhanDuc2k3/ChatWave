const mongoose = require("mongoose");

const chatbotMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatbotSession", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

function normalize(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

chatbotMessageSchema.set("toJSON", { transform: normalize });
chatbotMessageSchema.set("toObject", { transform: normalize });

module.exports = mongoose.model("ChatbotMessage", chatbotMessageSchema);
