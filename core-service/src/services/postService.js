const postRepository = require("../repositories/postRepository");

async function getAllPosts() {
  return postRepository.findAll();
}

async function getPostById(id) {
  return postRepository.findById(id);
}

async function createPost(payload) {
  if (!payload.authorName || !payload.text) {
    const err = new Error("authorName và text là bắt buộc");
    err.statusCode = 400;
    throw err;
  }

  return postRepository.create({
    authorId: payload.authorId ? String(payload.authorId) : null,
    authorName: payload.authorName,
    authorSubtitle: payload.authorSubtitle || "",
    text: payload.text,
    imageUrl: payload.imageUrl || null,
  });
}

async function getPostsByAuthor(userId) {
  return postRepository.findByAuthor(userId);
}

async function addComment(postId, payload) {
  if (!payload.author || !payload.text) {
    const err = new Error("author và text là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const updated = await postRepository.addComment(postId, {
    author: payload.author,
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

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  getPostsByAuthor,
  addComment,
  likePost,
  deletePost,
};

