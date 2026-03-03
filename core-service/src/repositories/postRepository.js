const Post = require("../models/Post");

async function findAll() {
  return Post.find().sort({ createdAt: -1 }).lean();
}

async function findById(id) {
  return Post.findById(id).lean();
}

async function create(data) {
  const post = await Post.create(data);
  return post.toObject();
}

async function addComment(postId, comment) {
  const post = await Post.findById(postId);
  if (!post) return null;
  post.commentList.unshift(comment);
  post.comments = post.commentList.length;
  await post.save();
  return post.toObject();
}

async function incrementLike(postId, delta = 1) {
  const post = await Post.findById(postId);
  if (!post) return null;
  post.likes = Math.max(0, (post.likes || 0) + delta);
  await post.save();
  return post.toObject();
}

module.exports = {
  findAll,
  findById,
  create,
  addComment,
  incrementLike,
};

