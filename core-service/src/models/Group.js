const mongoose = require("mongoose");

// Role system: Chỉ có 2 roles - leader (1 người/nhóm) và member
// Leader có thể chuyển giao quyền cho member khác
const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["leader", "member"],
      default: "member",
    },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    members: {
      type: [memberSchema],
      default: [],
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

groupSchema.set("toJSON", { transform: normalize });
groupSchema.set("toObject", { transform: normalize });

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;

