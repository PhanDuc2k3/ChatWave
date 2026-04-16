const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      enum: [
        "friend_request", 
        "task_assigned", 
        "task_status_changed", 
        "group_join_approved",
        "ai_alert_stuck",
        "ai_notification"
      ], 
      required: true 
    },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

function normalize(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
}
schema.set("toJSON", { transform: normalize });
schema.set("toObject", { transform: normalize });

module.exports = mongoose.model("Notification", schema);
