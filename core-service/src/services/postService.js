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
  const hasText = payload.text != null && String(payload.text).trim() !== "";
  const hasImage = payload.imageUrl != null && String(payload.imageUrl).trim() !== "";
  if (!hasText && !hasImage) {
    const err = new Error("Cần có nội dung text hoặc ảnh");
    err.statusCode = 400;
    throw err;
  }

  return postRepository.create({
    authorId: payload.authorId ? String(payload.authorId) : null,
    authorName: payload.authorName,
    authorSubtitle: payload.authorSubtitle || "",
    text: payload.text != null ? String(payload.text).trim() : "",
    imageUrl: payload.imageUrl || null,
    groupId: payload.groupId || null,
  });
}

async function getPostsByAuthor(userId) {
  return postRepository.findByAuthor(userId);
}

async function searchPosts(query) {
  return postRepository.search(query);
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
};

