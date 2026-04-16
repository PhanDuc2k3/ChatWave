const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    authorAvatar: { type: String, default: null },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    authorId: { type: String, default: null, index: true },
    authorName: { type: String, required: true },
    authorSubtitle: { type: String, default: "" },
    authorAvatar: { type: String, default: null },
    text: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    feeling: { type: String, default: null },
    poll: {
      question: { type: String, default: "" },
      options: [
        {
          text: { type: String, required: true },
          votes: { type: Number, default: 0 },
          votedBy: { type: [String], default: [] },
        },
      ],
    },
    scheduledAt: { type: Date, default: null },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] }, // user ids đã like
    commentList: { type: [commentSchema], default: [] },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
  },
  {
    timestamps: true,
  }
);

// Chuẩn hoá trả về: thêm field id, bỏ _id và __v
function normalize(doc, ret) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

postSchema.set("toJSON", { transform: normalize });
postSchema.set("toObject", { transform: normalize });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;

