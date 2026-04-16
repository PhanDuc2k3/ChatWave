const userRepository = require("../repositories/userRepository");
const { validateNewUser, validateUpdateUser } = require("../models/userModel");

async function getAllUsers() {
  return userRepository.findAll();
}

async function getUserById(id) {
  return userRepository.findById(id);
}

async function searchUsers(query) {
  return userRepository.search(query);
}

async function createUser(payload) {
  const { error, value } = validateNewUser(payload);
  if (error) {
    const err = new Error(error);
    err.statusCode = 400;
    throw err;
  }
  return userRepository.create(value);
}

async function updateUser(id, payload) {
  const { error, value } = validateUpdateUser(payload);
  if (error) {
    const err = new Error(error);
    err.statusCode = 400;
    throw err;
  }
  return userRepository.update(id, value);
}

async function deleteUser(id) {
  return userRepository.remove(id);
}

async function blockUser(id, reason) {
  return userRepository.update(id, {
    blocked: true,
    blockReason: reason || "Blocked by AI",
    blockedAt: new Date(),
  });
}

async function unblockUser(id) {
  return userRepository.update(id, {
    blocked: false,
    blockReason: null,
    blockedAt: null,
  });
}

async function getTeamById(teamId) {
  return userRepository.findByTeam(teamId);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  blockUser,
  unblockUser,
  getTeamById,
};

