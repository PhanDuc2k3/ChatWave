const express = require("express");
const aiController = require("../controllers/aiController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/analyze", requireAuth, aiController.analyze);
router.post("/execute-actions", requireAuth, aiController.executeAiActions);

module.exports = router;