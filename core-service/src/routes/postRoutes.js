const express = require("express");
const postController = require("../controllers/postController");

const router = express.Router();

// GET /api/v1/posts
router.get("/", postController.getAllPosts);

// GET /api/v1/posts/:id
router.get("/:id", postController.getPostById);

// POST /api/v1/posts
router.post("/", postController.createPost);

// POST /api/v1/posts/:id/comments
router.post("/:id/comments", postController.addComment);

// POST /api/v1/posts/:id/like
router.post("/:id/like", postController.likePost);

// DELETE /api/v1/posts/:id
router.delete("/:id", postController.deletePost);

module.exports = router;

