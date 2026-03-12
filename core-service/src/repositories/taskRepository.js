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

async function findAll() {
  const tasks = await Task.find().sort({ createdAt: -1 }).lean();
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
