const taskRepository = require("../repositories/taskRepository");
const groupRepository = require("../repositories/groupRepository");
const Notification = require("../models/Notification");
const { notifyTaskCompleted } = require("./webhookService");

async function notifyTaskRecipient(recipientId, type, title, message, meta = {}) {
  if (!recipientId) return;
  try {
    await Notification.create({
      userId: String(recipientId),
      type,
      title: title || "",
      message: message || "",
      link: "/tasks",
      meta,
    });
  } catch {
    // Fire-and-forget: notification failures must not break task flow
  }
}

function getStatusLabel(status) {
  const map = { pending: "Chờ làm", in_progress: "Đang làm", done: "Hoàn thành", cancelled: "Đã hủy" };
  return map[status] || status;
}

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

  // Xử lý description: có thể là string cũ hoặc object mới
  let description = payload.description || "";
  if (typeof payload.description === "object" && payload.description !== null) {
    description = {
      what: payload.description.what || "",
      purpose: payload.description.purpose || "",
      scopeDo: Array.isArray(payload.description.scopeDo) ? payload.description.scopeDo : [],
      scopeDont: Array.isArray(payload.description.scopeDont) ? payload.description.scopeDont : [],
    };
    // Loại bỏ các trường rỗng
    if (!description.what && !description.purpose && description.scopeDo.length === 0 && description.scopeDont.length === 0) {
      description = "";
    }
  }

  const created = await taskRepository.create({
    title: title.trim(),
    description,
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
    deliverables: Array.isArray(payload.deliverables) ? payload.deliverables : [],
    references: Array.isArray(payload.references) ? payload.references : [],
    risksNotes: payload.risksNotes || "",
    status: "pending",
    priority: ["low", "medium", "high"].includes(payload.priority)
      ? payload.priority
      : "medium",
  });
  if (created.assigneeId && String(created.assigneeId) !== String(assignerId)) {
    notifyTaskRecipient(
      created.assigneeId,
      "task_assigned",
      "Bạn được giao task",
      `${assignerName} giao task "${created.title}" cho bạn`,
      { taskId: created.id, task: created }
    ).catch(() => {});
  }
  return created;
}

async function getById(id) {
  return taskRepository.findById(id);
}

async function getByAssignee(userId) {
  if (!userId) return [];
  return taskRepository.findByAssignee(userId);
}

async function getAll(userId, context = null, sourceId = null) {
  if (!userId) return [];
  const query = { userId };
  if (context) query.context = context;
  if (sourceId) query.sourceId = sourceId;
  return taskRepository.findAll(query);
}

async function getStatusChangeRecipient(task, actorId, newStatus) {
  const aid = String(actorId || "");
  if (!aid) return null;
  if (task.source === "group" && task.sourceId) {
    const group = await groupRepository.findById(task.sourceId);
    if (!group || !group.ownerId) return null;
    const ownerId = String(group.ownerId);
    if (ownerId === aid) return null;
    return ownerId;
  }
  if (task.source === "friend") {
    const assignerId = String(task.assignerId || "");
    const assigneeId = String(task.assigneeId || "");
    if (aid === assignerId && assigneeId) return assigneeId;
    if (aid === assigneeId && assignerId) return assignerId;
  }
  return null;
}

async function submitTask(taskId, payload, actorId) {
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
    notifyTaskCompleted(updated).catch(() => {});
    const recipientId = await getStatusChangeRecipient(updated, actorId, "done");
    if (recipientId) {
      const actorName = String(actorId) === String(updated.assigneeId) ? updated.assigneeName : updated.assignerName;
      notifyTaskRecipient(
        recipientId,
        "task_status_changed",
        "Task đã thay đổi trạng thái",
        `${actorName} đã đánh dấu task "${updated.title}" là Hoàn thành`,
        { taskId: updated.id, task: updated, newStatus: "done" }
      ).catch(() => {});
    }
  }
  return updated;
}

async function updateStatus(taskId, status, actorId) {
  if (!["pending", "in_progress", "done", "cancelled"].includes(status)) return null;
  const task = await taskRepository.findById(taskId);
  if (!task) return null;
  const updateData = { status };
  if (status === "done") {
    updateData.completedAt = new Date();
  }
  const updated = await taskRepository.update(taskId, updateData);
  if (updated && updated.status === "done") {
    notifyTaskCompleted(updated).catch(() => {});
  }
  const recipientId = await getStatusChangeRecipient(updated, actorId, status);
  if (recipientId) {
    const actorName = String(actorId) === String(updated.assigneeId) ? updated.assigneeName : updated.assignerName;
    const label = getStatusLabel(status);
    notifyTaskRecipient(
      recipientId,
      "task_status_changed",
      "Task đã thay đổi trạng thái",
      `${actorName} đã chuyển task "${updated.title}" sang ${label}`,
      { taskId: updated.id, task: updated, newStatus: status }
    ).catch(() => {});
  }
  return updated;
}

async function updateTask(taskId, payload, actorId) {
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
  if (payload.description != null) {
    let desc = payload.description;
    if (typeof desc === "object" && desc !== null) {
      desc = {
        what: desc.what || "",
        purpose: desc.purpose || "",
        scopeDo: Array.isArray(desc.scopeDo) ? desc.scopeDo : [],
        scopeDont: Array.isArray(desc.scopeDont) ? desc.scopeDont : [],
      };
      if (!desc.what && !desc.purpose && desc.scopeDo.length === 0 && desc.scopeDont.length === 0) {
        desc = "";
      }
    } else {
      desc = String(desc).trim();
    }
    updateData.description = desc;
  }
  if (payload.assigneeId != null) updateData.assigneeId = payload.assigneeId;
  if (payload.assigneeName != null) updateData.assigneeName = payload.assigneeName;
  if (payload.reviewerId != null) updateData.reviewerId = payload.reviewerId;
  if (payload.reviewerName != null) updateData.reviewerName = payload.reviewerName;
  if (payload.dueDate != null) updateData.dueDate = String(payload.dueDate);
  if (payload.estimatedEffort != null) updateData.estimatedEffort = String(payload.estimatedEffort);
  if (payload.expectedResults != null) updateData.expectedResults = parseArr(payload.expectedResults);
  if (payload.acceptanceCriteria != null) updateData.acceptanceCriteria = parseCriteria(payload.acceptanceCriteria);
  if (payload.deliverables != null) updateData.deliverables = Array.isArray(payload.deliverables) ? payload.deliverables : [];
  if (payload.references != null) updateData.references = Array.isArray(payload.references) ? payload.references : [];
  if (payload.risksNotes != null) updateData.risksNotes = String(payload.risksNotes);
  if (payload.priority != null && ["low", "medium", "high"].includes(payload.priority)) updateData.priority = payload.priority;

  const assigneeChanged =
    payload.assigneeId != null && String(payload.assigneeId) !== String(task.assigneeId || "");
  const newAssigneeId = payload.assigneeId != null ? payload.assigneeId : task.assigneeId;

  const updated = await taskRepository.update(taskId, updateData);
  if (assigneeChanged && newAssigneeId && String(newAssigneeId) !== String(actorId || "")) {
    const assignerName = updated.assignerName || task.assignerName;
    notifyTaskRecipient(
      newAssigneeId,
      "task_assigned",
      "Bạn được giao task",
      `${assignerName} giao task "${updated.title}" cho bạn`,
      { taskId: updated.id, task: updated }
    ).catch(() => {});
  }
  return updated;
}

async function deleteTask(taskId) {
  return taskRepository.remove(taskId);
}

async function reassignTask(taskId, assigneeId, assigneeName, actorId) {
  const task = await taskRepository.findById(taskId);
  if (!task) return null;
  const updated = await taskRepository.update(taskId, {
    assigneeId: assigneeId || null,
    assigneeName: assigneeName || null,
  });
  if (updated && assigneeId && String(assigneeId) !== String(actorId || "")) {
    const assignerName = updated.assignerName || task.assignerName;
    notifyTaskRecipient(
      assigneeId,
      "task_assigned",
      "Bạn được giao task",
      `${assignerName} giao task "${updated.title}" cho bạn`,
      { taskId: updated.id, task: updated }
    ).catch(() => {});
  }
  return updated;
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
