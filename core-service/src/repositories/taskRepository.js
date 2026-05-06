const Task = require("../models/Task");

async function create(data) {
  const task = await Task.create(data);
  return task.toObject();
}

async function findById(id) {
  const t = await Task.findById(id).lean();
  return t || null;
}

async function findByAssignee(userId) {
  const tasks = await Task.find({ assigneeId: String(userId) })
    .sort({ createdAt: -1 })
    .lean();
  return tasks;
}

async function findAll(query = {}) {
  const filter = {};

  if (query.assigneeId) {
    filter.assigneeId = String(query.assigneeId);
  } else if (query.userId) {
    const userId = String(query.userId);

    // Context-based filtering
    if (query.context === "personal") {
      // Personal mode: chỉ lấy task của chính mình (giao + được giao)
      filter.$or = [
        { assignerId: userId },
        { assigneeId: userId },
      ];
    } else if (query.context === "group" && query.sourceId) {
      // Group mode: lấy tất cả task của nhóm (chỉ leader mới có quyền này)
      filter.source = "group";
      filter.sourceId = String(query.sourceId);
    } else if (query.context === "friend_1to1" && query.sourceId) {
      // 1-1 mode: lấy task giữa 2 người (không phân biệt ai giao)
      // Task mà user giao cho người kia HOẶC người kia giao cho user
      filter.source = "friend";
      filter.sourceId = String(query.sourceId);
    } else {
      // Default: lấy task mà user là người giao HOẶC người nhận
      filter.$or = [
        { assignerId: userId },
        { assigneeId: userId },
      ];
    }
  }

  // Filter by assigner (task mình giao)
  if (query.assignerId) {
    filter.assignerId = String(query.assignerId);
  }

  // Filter by assignee (task được giao cho mình)
  if (query.onlyAssignedToMe && query.userId) {
    filter.assigneeId = String(query.userId);
  }

  // Filter by source
  if (query.source) {
    filter.source = query.source;
  }

  const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
  return tasks;
}

async function update(id, data) {
  const task = await Task.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
  return task || null;
}

async function remove(id) {
  const res = await Task.findByIdAndDelete(id);
  return !!res;
}

module.exports = {
  create,
  findById,
  findByAssignee,
  findAll,
  update,
  remove,
};
