const express = require("express");
const chatController = require("../controllers/chatController");
const { executeActions } = require("../services/action.executor");

const router = express.Router();

router.post("/chat/completions", chatController.createCompletion);
router.post("/chat/create-tasks", chatController.createTasksFromChat);

// Execute AI actions (from Apply button)
router.post("/ai/execute-actions", async (req, res) => {
  try {
    const { actions, teamId } = req.body || {};
    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ message: "actions phải là mảng" });
    }

    const actorId = req.user?.id || teamId || "system";
    const result = await executeActions(actions, actorId);

    res.json({
      success: true,
      executed: result.executed,
      failed: result.failed,
    });
  } catch (err) {
    console.error("[ai] execute-actions error:", err?.message);
    res.status(500).json({ message: "Lỗi khi thực thi actions" });
  }
});

module.exports = router;
