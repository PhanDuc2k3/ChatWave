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
    authorName: payload.authorName,
    authorSubtitle: payload.authorSubtitle || "",
    text: payload.text,
    imageUrl: payload.imageUrl || null,
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
    text: payload.text,
    timeAgo: payload.timeAgo || "Vừa xong",
  });
  return updated;
}

async function likePost(postId) {
  return postRepository.incrementLike(postId, 1);
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  addComment,
  likePost,
};

