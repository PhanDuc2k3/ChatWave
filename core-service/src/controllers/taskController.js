const taskService = require("../services/taskService");

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await taskService.getById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function getTasksByAssignee(req, res, next) {
  try {
    const { userId } = req.query;
    const tasks = await taskService.getByAssignee(userId);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function getAllTasks(req, res, next) {
  try {
    const tasks = await taskService.getAll();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function submitTask(req, res, next) {
  try {
    const task = await taskService.submitTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!status || !["pending", "in_progress", "done"].includes(status)) {
      return res.status(400).json({ message: "status phải là pending, in_progress hoặc done" });
    }
    const task = await taskService.updateStatus(req.params.id, status);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const deleted = await taskService.deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function reassignTask(req, res, next) {
  try {
    const { assigneeId, assigneeName } = req.body || {};
    if (!assigneeId) {
      return res.status(400).json({ message: "assigneeId là bắt buộc" });
    }
    const task = await taskService.reassignTask(req.params.id, assigneeId, assigneeName);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getTaskById,
  getTasksByAssignee,
  getAllTasks,
  submitTask,
  updateStatus,
  updateTask,
  deleteTask,
  reassignTask,
};
