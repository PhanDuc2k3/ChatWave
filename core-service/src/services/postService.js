const postRepository = require("../repositories/postRepository");

async function getAllPosts() {
  return postRepository.findAll();
}

async function getPostsByGroup(groupId) {
  if (!groupId) return [];
  return postRepository.findByGroup(groupId);
}

async function getPostById(id) {
  return postRepository.findById(id);
}

async function createPost(payload) {
  if (!payload.authorName) {
    const err = new Error("authorName là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return postRepository.create({
    authorId: payload.authorId ? String(payload.authorId) : null,
    authorName: payload.authorName,
    authorSubtitle: payload.authorSubtitle || "",
    authorAvatar: payload.authorAvatar || null,
    text: payload.text != null ? String(payload.text).trim() : "",
    imageUrl: payload.imageUrl || null,
    feeling: payload.feeling || null,
    poll: payload.poll || null,
    scheduledAt: payload.scheduledAt || null,
    groupId: payload.groupId || null,
  });
}

async function getPostsByAuthor(userId) {
  return postRepository.findByAuthor(userId);
}

async function searchPosts(query) {
  return postRepository.search(query);
}

async function votePoll(postId, optionIndex) {
  const post = await postRepository.findById(postId);
  if (!post || !post.poll || !Array.isArray(post.poll.options)) return null;
  const idx = Number(optionIndex);
  if (Number.isNaN(idx) || idx < 0 || idx >= post.poll.options.length) return post;

  const options = post.poll.options.map((opt, i) =>
    i === idx ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
  );

  return postRepository.update(postId, {
    poll: {
      question: post.poll.question,
      options,
    },
  });
}

async function addComment(postId, payload) {
  if (!payload.author || !payload.text) {
    const err = new Error("author và text là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const updated = await postRepository.addComment(postId, {
    author: payload.author,
    authorAvatar: payload.authorAvatar || null,
    text: payload.text,
  });
  return updated;
}

async function likePost(postId, userId) {
  if (!userId) {
    const err = new Error("userId là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  return postRepository.toggleLike(postId, userId);
}

async function deletePost(postId) {
  return postRepository.remove(postId);
}

async function updatePost(postId, payload) {
  const post = await postRepository.findById(postId);
  if (!post) return null;

  const hasText = payload.text != null && String(payload.text).trim() !== "";
  const hasImage = payload.imageUrl != null && String(payload.imageUrl).trim() !== "";
  if (payload.text != null && payload.imageUrl != null && !hasText && !hasImage) {
    const err = new Error("Cần có ít nhất text hoặc ảnh");
    err.statusCode = 400;
    throw err;
  }

  const updateData = {};
  if (payload.text != null) updateData.text = String(payload.text).trim();
  if (payload.imageUrl != null) updateData.imageUrl = payload.imageUrl;
  if (payload.feeling !== undefined) updateData.feeling = payload.feeling;
  if (payload.scheduledAt !== undefined) updateData.scheduledAt = payload.scheduledAt;
  if (payload.poll !== undefined) updateData.poll = payload.poll;

  return postRepository.update(postId, updateData);
}

module.exports = {
  getAllPosts,
  getPostsByGroup,
  getPostById,
  createPost,
  getPostsByAuthor,
  searchPosts,
  addComment,
  likePost,
  deletePost,
  updatePost,
  votePoll,
};

