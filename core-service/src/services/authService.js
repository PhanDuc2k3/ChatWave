const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userRepository = require("../repositories/userRepository");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { validateNewUser, validatePassword } = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 8);

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

  const passwordHash = await bcrypt.hash(value.password, BCRYPT_SALT_ROUNDS);

  const user = await userRepository.create({
    username: value.username,
    email: value.email,
    phone: value.phone,
    passwordHash,
  });

  const { accessToken, refreshToken } = await createTokenPair(user);

  return {
    user,
    accessToken,
    refreshToken,
    token: accessToken,
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

  const { accessToken, refreshToken } = await createTokenPair(safeUser);

  return {
    user: safeUser,
    accessToken,
    refreshToken,
    token: accessToken,
  };
}

function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id || user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

async function createTokenPair(user) {
  const accessToken = createAccessToken(user);
  const refreshTokenValue = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  await RefreshToken.create({
    userId: String(user.id || user._id),
    token: refreshTokenValue,
    expiresAt,
  });
  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

async function refresh(refreshTokenValue) {
  if (!refreshTokenValue || typeof refreshTokenValue !== "string") {
    const err = new Error("Refresh token không hợp lệ");
    err.statusCode = 401;
    throw err;
  }
  const doc = await RefreshToken.findOne({ token: refreshTokenValue });
  if (!doc || doc.expiresAt < new Date()) {
    if (doc) await RefreshToken.deleteOne({ _id: doc._id });
    const err = new Error("Refresh token không hợp lệ hoặc đã hết hạn");
    err.statusCode = 401;
    throw err;
  }
  const user = await userRepository.findById(doc.userId);
  if (!user) {
    await RefreshToken.deleteOne({ _id: doc._id });
    const err = new Error("Người dùng không tồn tại");
    err.statusCode = 401;
    throw err;
  }
  await RefreshToken.deleteOne({ _id: doc._id });
  const { accessToken, refreshToken } = await createTokenPair(user);
  return { accessToken, refreshToken };
}

// In-memory store for reset tokens (use Redis in production)
const resetTokens = new Map();

async function changePassword(userId, currentPassword, newPassword) {
  if (!userId || !currentPassword || !newPassword) {
    const err = new Error("userId, currentPassword và newPassword là bắt buộc");
    err.statusCode = 400;
    throw err;
  }
  const pwdErr = validatePassword(newPassword);
  if (pwdErr) {
    const err = new Error(pwdErr);
    err.statusCode = 400;
    throw err;
  }
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
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
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
  const token = crypto.randomBytes(32).toString("hex");
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
  const pwdErr = validatePassword(newPassword);
  if (pwdErr) {
    const err = new Error(pwdErr);
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
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
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
  refresh,
  changePassword,
  forgotPassword,
  resetPassword,
};

