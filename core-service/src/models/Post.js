const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
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
    text: { type: String, required: true },
    imageUrl: { type: String, default: null },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] }, // user ids đã like
    commentList: { type: [commentSchema], default: [] },
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

