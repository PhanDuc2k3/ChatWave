const taskRepository = require("../repositories/taskRepository");
const { notifyTaskCompleted } = require("./webhookService");

async function createTask(payload) {
  const { title, assignerId, assignerName, source, sourceName } = payload || {};
  if (!title || !assignerId || !assignerName || !sourceName) {
    const err = new Error("title, assignerId, assignerName, sourceName là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const src = ["group", "friend"].includes(source) ? source : "friend";
  const parseArr = (v) =>
    Array.isArray(v) ? v : typeof v === "string" && v.trim() ? v.split("\n").map((s) => s.trim()).filter(Boolean) : [];
  const parseCriteria = (v) => {
    if (!Array.isArray(v)) {
      const arr = typeof v === "string" && v.trim()
        ? v.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];
      return arr.map((text) => ({ text, checked: false }));
    }
    return v.map((x) => (typeof x === "string" ? { text: x, checked: false } : x));
  };

  return taskRepository.create({
    title: title.trim(),
    description: payload.description || "",
    assignerId: String(assignerId),
    assignerName: assignerName.trim(),
    assigneeId: payload.assigneeId || null,
    assigneeName: payload.assigneeName || null,
    reviewerId: payload.reviewerId || null,
    reviewerName: payload.reviewerName || null,
    source: src,
    sourceId: payload.sourceId || null,
    sourceName: sourceName.trim(),
    dueDate: payload.dueDate || "",
    estimatedEffort: payload.estimatedEffort || "",
    expectedResults: parseArr(payload.expectedResults),
    acceptanceCriteria: parseCriteria(payload.acceptanceCriteria),
    deliverables: payload.deliverables || [],
    references: payload.references || [],
    risksNotes: payload.risksNotes || "",
    status: "pending",
    priority: ["low", "medium", "high"].includes(payload.priority)
      ? payload.priority
      : "medium",
  });
}

async function getById(id) {
  return taskRepository.findById(id);
}

async function getByAssignee(userId) {
  if (!userId) return [];
  return taskRepository.findByAssignee(userId);
}

async function getAll() {
  return taskRepository.findAll();
}

async function submitTask(taskId, payload) {
  const task = await taskRepository.findById(taskId);
  if (!task) return null;

  const updateData = {
    status: "done",
    completedAt: payload.completedAt || new Date(),
    completionNote: payload.completionNote != null ? String(payload.completionNote).trim() : "",
    submissionDeliverables: Array.isArray(payload.submissionDeliverables)
      ? payload.submissionDeliverables
      : [],
  };
  const updated = await taskRepository.update(taskId, updateData);
  if (updated && updated.status === "done") {
    // Fire-and-forget webhook; do not block main flow
    notifyTaskCompleted(updated).catch(() => {});
  }
  return updated;
}

async function updateStatus(taskId, status) {
  if (!["pending", "in_progress", "done"].includes(status)) return null;
  const updateData = { status };
  if (status === "done") {
    updateData.completedAt = new Date();
  }
  const updated = await taskRepository.update(taskId, updateData);
  if (updated && updated.status === "done") {
    notifyTaskCompleted(updated).catch(() => {});
  }
  return updated;
}

async function updateTask(taskId, payload) {
  const task = await taskRepository.findById(taskId);
  if (!task) return null;

  const parseArr = (v) =>
    Array.isArray(v) ? v : typeof v === "string" && v.trim() ? v.split("\n").map((s) => s.trim()).filter(Boolean) : [];
  const parseCriteria = (v) => {
    if (!Array.isArray(v)) {
      const arr = typeof v === "string" && v.trim() ? v.split("\n").map((s) => s.trim()).filter(Boolean) : [];
      return arr.map((text) => ({ text, checked: false }));
    }
    return v.map((x) => (typeof x === "string" ? { text: x, checked: false } : x));
  };

  const updateData = {};
  if (payload.title != null) updateData.title = String(payload.title).trim();
  if (payload.description != null) updateData.description = String(payload.description).trim();
  if (payload.assigneeId != null) updateData.assigneeId = payload.assigneeId;
  if (payload.assigneeName != null) updateData.assigneeName = payload.assigneeName;
  if (payload.reviewerId != null) updateData.reviewerId = payload.reviewerId;
  if (payload.reviewerName != null) updateData.reviewerName = payload.reviewerName;
  if (payload.dueDate != null) updateData.dueDate = String(payload.dueDate);
  if (payload.estimatedEffort != null) updateData.estimatedEffort = String(payload.estimatedEffort);
  if (payload.expectedResults != null) updateData.expectedResults = parseArr(payload.expectedResults);
  if (payload.acceptanceCriteria != null) updateData.acceptanceCriteria = parseCriteria(payload.acceptanceCriteria);
  if (payload.deliverables != null) updateData.deliverables = payload.deliverables;
  if (payload.references != null) updateData.references = payload.references;
  if (payload.risksNotes != null) updateData.risksNotes = String(payload.risksNotes);
  if (payload.priority != null && ["low", "medium", "high"].includes(payload.priority)) updateData.priority = payload.priority;

  return taskRepository.update(taskId, updateData);
}

async function deleteTask(taskId) {
  return taskRepository.remove(taskId);
}

async function reassignTask(taskId, assigneeId, assigneeName) {
  const task = await taskRepository.findById(taskId);
  if (!task) return null;
  return taskRepository.update(taskId, {
    assigneeId: assigneeId || null,
    assigneeName: assigneeName || null,
  });
}

module.exports = {
  createTask,
  getById,
  getByAssignee,
  getAll,
  submitTask,
  updateStatus,
  updateTask,
  deleteTask,
  reassignTask,
};
