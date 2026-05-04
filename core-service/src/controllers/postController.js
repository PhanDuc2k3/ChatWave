const postService = require("../services/postService");
const groupService = require("../services/groupService");

async function getAllPosts(req, res, next) {
  try {
    const { groupId, userId, page = 1, limit = 5 } = req.query;
    
    if (groupId) {
      const isMember = await groupService.isMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({
          message: "Bạn cần tham gia nhóm để xem bài viết.",
        });
      }
      const posts = await postService.getPostsByGroup(groupId);
      return res.json({ posts, pagination: { hasMore: false } });
    }
    
    const result = await postService.getAllPosts(Number(page), Number(limit));
    res.json(result);
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
    const { groupId, authorId } = req.body || {};
    if (groupId) {
      const isMember = await groupService.isMember(groupId, authorId);
      if (!isMember) {
        return res.status(403).json({
          message: "Bạn cần tham gia nhóm để đăng bài.",
        });
      }
    }
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

async function updatePost(req, res, next) {
  try {
    const post = await postService.updatePost(req.params.id, req.body);
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

async function getPostsByAuthor(req, res, next) {
  try {
    const posts = await postService.getPostsByAuthor(req.params.userId);
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

async function searchPosts(req, res, next) {
  try {
    const { q } = req.query;
    const posts = await postService.searchPosts(q);
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

async function votePoll(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const { optionIndex } = req.body || {};
    const post = await postService.votePoll(req.params.id, optionIndex, userId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  addComment,
  likePost,
  getPostsByAuthor,
  searchPosts,
  deletePost,
  votePoll,
};

