const authService = require("../services/authService");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { userId, currentPassword, newPassword } = req.body || {};
    await authService.changePassword(userId, currentPassword, newPassword);
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    await authService.resetPassword(token, newPassword);
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  register,
  changePassword,
  forgotPassword,
  resetPassword,
};

