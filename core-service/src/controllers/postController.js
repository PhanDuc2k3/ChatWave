const postService = require("../services/postService");

async function getAllPosts(req, res, next) {
  try {
    const posts = await postService.getAllPosts();
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

async function getPostById(req, res, next) {
  try {
    const post = await postService.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const post = await postService.createPost(req.body);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const post = await postService.addComment(req.params.id, req.body);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
}

async function likePost(req, res, next) {
  try {
    const { userId } = req.body || {};
    const post = await postService.likePost(req.params.id, userId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const deleted = await postService.deletePost(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  addComment,
  likePost,
  deletePost,
};

