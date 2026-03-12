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

// In-memory store for reset tokens (use Redis in production)
const resetTokens = new Map();

async function changePassword(userId, currentPassword, newPassword) {
  if (!userId || !currentPassword || !newPassword) {
    const err = new Error("userId, currentPassword và newPassword là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const User = require("../models/User");
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User không tồn tại");
    err.statusCode = 404;
    throw err;
  }
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    const err = new Error("Mật khẩu hiện tại không đúng");
    err.statusCode = 401;
    throw err;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.updateOne({ passwordHash });
  return { message: "Đổi mật khẩu thành công" };
}

async function forgotPassword(email) {
  if (!email) {
    const err = new Error("Email là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const existing = await userRepository.findByEmail(String(email).trim().toLowerCase());
  if (!existing) {
    // Don't reveal if email exists
    return { message: "Nếu email tồn tại, bạn sẽ nhận hướng dẫn đặt lại mật khẩu." };
  }
  const token = require("crypto").randomBytes(32).toString("hex");
  resetTokens.set(token, { userId: existing._id.toString(), expiresAt: Date.now() + 3600000 });
  // TODO: Send email with reset link. For demo, return token in response.
  return { message: "Kiểm tra email của bạn.", resetToken: token };
}

async function resetPassword(token, newPassword) {
  if (!token || !newPassword) {
    const err = new Error("token và newPassword là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const data = resetTokens.get(token);
  if (!data || data.expiresAt < Date.now()) {
    const err = new Error("Token không hợp lệ hoặc đã hết hạn");
    err.statusCode = 400;
    throw err;
  }
  resetTokens.delete(token);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await userRepository.update(data.userId, { passwordHash });
  if (!user) {
    const err = new Error("User không tồn tại");
    err.statusCode = 404;
    throw err;
  }
  return { message: "Đặt lại mật khẩu thành công" };
}

module.exports = {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
};

