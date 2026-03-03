const Post = require("../models/Post");

async function findAll() {
  const posts = await Post.find().sort({ createdAt: -1 });
  return posts.map((p) => p.toObject());
}

async function findById(id) {
  const post = await Post.findById(id);
  return post ? post.toObject() : null;
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

async function remove(id) {
  const res = await Post.findByIdAndDelete(id);
  return !!res;
}

async function incrementLike(postId, delta = 1) {
  const post = await Post.findById(postId);
  if (!post) return null;
  post.likes = Math.max(0, (post.likes || 0) + delta);
  await post.save();
  return post.toObject();
}

async function toggleLike(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) return null;

  const likedBy = post.likedBy || [];
  const hasLiked = likedBy.includes(userId);

  if (hasLiked) {
    post.likedBy = likedBy.filter((id) => id !== userId);
    post.likes = Math.max(0, (post.likes || 0) - 1);
  } else {
    post.likedBy.push(userId);
    post.likes = (post.likes || 0) + 1;
  }

  await post.save();
  return post.toObject();
}

module.exports = {
  findAll,
  findById,
  create,
  addComment,
  toggleLike,
  remove,
};

