const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    displayName: { type: String, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    groupName: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
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

module.exports = mongoose.model("GroupJoinRequest", schema);
