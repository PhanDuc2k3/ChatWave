const Post = require("../models/Post");

async function search(query) {
  const q = String(query || "").trim();
  if (!q) return [];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const posts = await Post.find({
    $or: [{ text: regex }, { authorName: regex }],
    groupId: null,
  })
    .sort({ createdAt: -1 })
    .limit(20);
  return posts.map((p) => p.toObject());
}

async function findAll() {
  const posts = await Post.find({ groupId: null }).sort({ createdAt: -1 });
  return posts.map((p) => p.toObject());
}

async function findByGroup(groupId) {
  const posts = await Post.find({ groupId }).sort({ createdAt: -1 });
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

async function findByAuthor(userId) {
  const uid = String(userId);
  const posts = await Post.find({ authorId: uid }).sort({ createdAt: -1 });
  return posts.map((p) => p.toObject());
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

async function update(id, data) {
  const post = await Post.findByIdAndUpdate(id, { $set: data }, { new: true });
  return post ? post.toObject() : null;
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
  search,
  findAll,
  findByGroup,
  findById,
  create,
  findByAuthor,
  addComment,
  toggleLike,
  remove,
  update,
};

