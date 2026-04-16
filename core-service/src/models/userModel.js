// Very small validation helpers instead of bringing in a full schema library.

function validatePassword(password) {
  if (!password || typeof password !== "string") return "Mật khẩu không được để trống";
  const p = String(password).trim();
  if (p.length < 6) return "Mật khẩu cần ít nhất 6 ký tự";
  if (!/[a-zA-Z]/.test(p)) return "Mật khẩu cần có ít nhất 1 chữ cái";
  if (!/[0-9]/.test(p)) return "Mật khẩu cần có ít nhất 1 chữ số";
  return null;
}

function validateNewUser(payload = {}) {
  const errors = [];

  if (!payload.username || typeof payload.username !== "string") {
    errors.push("username is required");
  }
  if (!payload.email || typeof payload.email !== "string") {
    errors.push("email is required");
  }
  if (!payload.password || typeof payload.password !== "string") {
    errors.push("password is required");
  } else {
    const pwdErr = validatePassword(payload.password);
    if (pwdErr) errors.push(pwdErr);
  }

  if (errors.length) {
    return { error: errors.join(", "), value: null };
  }

  const value = {
    username: payload.username.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password, // NOTE: hash before saving in a real app
    phone: payload.phone || null,
  };

  return { error: null, value };
}

function validateUpdateUser(payload = {}) {
  const value = {};

  if (payload.username != null) {
    value.username = String(payload.username).trim();
  }
  if (payload.email != null) {
    value.email = String(payload.email).trim().toLowerCase();
  }
  if (payload.phone != null) {
    value.phone = String(payload.phone) || null;
  }
  if (payload.avatar != null) {
    value.avatar = String(payload.avatar) || null;
  }
  if (payload.bio != null) {
    value.bio = String(payload.bio).trim();
  }

  return { error: null, value };
}

module.exports = {
  validateNewUser,
  validateUpdateUser,
  validatePassword,
};

