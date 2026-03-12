const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.post("/", taskController.createTask);
router.get("/by-assignee", taskController.getTasksByAssignee);
router.get("/", taskController.getAllTasks);
router.post("/:id/submit", taskController.submitTask);
router.patch("/:id/status", taskController.updateStatus);
router.patch("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);
router.patch("/:id/reassign", taskController.reassignTask);
router.get("/:id", taskController.getTaskById);

module.exports = router;
