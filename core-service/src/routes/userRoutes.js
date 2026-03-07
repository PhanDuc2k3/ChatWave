const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// GET /api/v1/users/search?q=...
router.get("/search", userController.searchUsers);

// GET /api/v1/users
router.get("/", userController.getAllUsers);

// GET /api/v1/users/:id
router.get("/:id", userController.getUserById);

// POST /api/v1/users
router.post("/", userController.createUser);

// PUT /api/v1/users/:id
router.put("/:id", userController.updateUser);

// DELETE /api/v1/users/:id
router.delete("/:id", userController.deleteUser);

module.exports = router;

