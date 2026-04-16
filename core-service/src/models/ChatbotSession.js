const mongoose = require("mongoose");

const chatbotSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "Cuộc hội thoại mới" },
  },
  { timestamps: true }
);

function normalize(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

chatbotSessionSchema.set("toJSON", { transform: normalize });
chatbotSessionSchema.set("toObject", { transform: normalize });

module.exports = mongoose.model("ChatbotSession", chatbotSessionSchema);
