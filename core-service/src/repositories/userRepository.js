const User = require("../models/User");

async function findAll() {
  const users = await User.find().lean();
  return users.map((u) => {
    const copy = { ...u };
    delete copy.passwordHash;
    return copy;
  });
}

async function search(query) {
  const q = String(query || "").trim();
  if (!q) return [];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const users = await User.find({
    $or: [{ username: regex }, { email: regex }],
  })
    .limit(20)
    .lean();
  return users.map((u) => {
    const copy = { ...u };
    delete copy.passwordHash;
    return copy;
  });
}

async function findById(id) {
  const user = await User.findById(id).lean();
  if (!user) return null;
  const copy = { ...user };
  delete copy.passwordHash;
  return copy;
}

async function findByEmail(email) {
  return User.findOne({ email }).lean();
}

async function create(data) {
  const user = await User.create(data);
  // Remove passwordHash from returned object
  const plain = user.toObject();
  delete plain.passwordHash;
  return plain;
}

async function update(id, data) {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
  if (!user) return null;
  delete user.passwordHash;
  return user;
}

async function remove(id) {
  const res = await User.findByIdAndDelete(id);
  return !!res;
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  remove,
  search,
};

