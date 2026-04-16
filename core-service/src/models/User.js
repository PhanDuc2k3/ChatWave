const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: null,
    },
    avatar: { type: String, default: null },
    bio: { type: String, default: "", trim: true },
    blocked: {
      type: Boolean,
      default: false,
    },
    blockReason: {
      type: String,
      default: null,
    },
    blockedAt: {
      type: Date,
      default: null,
    },
    teamId: {
      type: String,
      default: null,
      index: true,
    },
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

userSchema.set("toJSON", { transform: normalize });
userSchema.set("toObject", { transform: normalize });

const User = mongoose.model("User", userSchema);

module.exports = User;

