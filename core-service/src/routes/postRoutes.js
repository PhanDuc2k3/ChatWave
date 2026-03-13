const express = require("express");
const postController = require("../controllers/postController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Các API chỉ xem bài viết - cho phép cả khách vãng lai
// GET /api/v1/posts
router.get("/", postController.getAllPosts);

// GET /api/v1/posts/search?q=...
router.get("/search", postController.searchPosts);

// GET /api/v1/posts/by-author/:userId
router.get("/by-author/:userId", postController.getPostsByAuthor);

// GET /api/v1/posts/:id
router.get("/:id", postController.getPostById);

// Các API thao tác với bài viết - bắt buộc đăng nhập
// POST /api/v1/posts
router.post("/", requireAuth, postController.createPost);
router.patch("/:id", requireAuth, postController.updatePost);

// POST /api/v1/posts/:id/comments
router.post("/:id/comments", requireAuth, postController.addComment);

// POST /api/v1/posts/:id/poll-vote
router.post("/:id/poll-vote", requireAuth, postController.votePoll);

// POST /api/v1/posts/:id/like
router.post("/:id/like", requireAuth, postController.likePost);

// DELETE /api/v1/posts/:id
router.delete("/:id", requireAuth, postController.deletePost);

module.exports = router;

