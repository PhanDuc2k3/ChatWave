const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const { validateNewUser } = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

async function register(payload) {
  const { error, value } = validateNewUser(payload);
  if (error) {
    const err = new Error(error);
    err.statusCode = 400;
    throw err;
  }

  const existing = await userRepository.findByEmail(value.email);
  if (existing) {
    const err = new Error("Email đã được sử dụng");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(value.password, 10);

  const user = await userRepository.create({
    username: value.username,
    email: value.email,
    phone: value.phone,
    passwordHash,
  });

  const token = createToken(user);

  return {
    user,
    token,
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error("Email và mật khẩu là bắt buộc");
    err.statusCode = 400;
    throw err;
  }

  const existing = await userRepository.findByEmail(
    String(email).trim().toLowerCase()
  );
  if (!existing) {
    const err = new Error("Email hoặc mật khẩu không đúng");
    err.statusCode = 401;
    throw err;
  }

  // existing was returned as lean object without passwordHash, so fetch full doc
  const User = require("../models/User");
  const fullUser = await User.findById(existing._id);
  if (!fullUser) {
    const err = new Error("Email hoặc mật khẩu không đúng");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, fullUser.passwordHash);
  if (!ok) {
    const err = new Error("Email hoặc mật khẩu không đúng");
    err.statusCode = 401;
    throw err;
  }

  const safeUser = fullUser.toObject();
  delete safeUser.passwordHash;

  const token = createToken(safeUser);

  return {
    user: safeUser,
    token,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id || user._id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

module.exports = {
  register,
  login,
};

