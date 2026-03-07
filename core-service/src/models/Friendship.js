const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema(
  {
    userA: {
      type: String,
      required: true,
      index: true,
    },
    userB: {
      type: String,
      required: true,
      index: true,
    },
    requesterId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });

function normalize(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

friendshipSchema.set("toJSON", { transform: normalize });
friendshipSchema.set("toObject", { transform: normalize });

const Friendship = mongoose.model("Friendship", friendshipSchema);

module.exports = Friendship;

