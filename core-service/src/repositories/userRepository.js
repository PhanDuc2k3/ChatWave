const User = require("../models/User");

async function findAll() {
  return User.find().lean();
}

async function findById(id) {
  return User.findById(id).lean();
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
};

