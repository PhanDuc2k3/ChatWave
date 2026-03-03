const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    text: { type: String, required: true },
    timeAgo: { type: String, default: "" }, // frontend có thể tự format lại
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    authorName: { type: String, required: true },
    authorSubtitle: { type: String, default: "" },
    text: { type: String, required: true },
    imageUrl: { type: String, default: null },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    commentList: { type: [commentSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;

