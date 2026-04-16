const notificationService = require("../services/notificationService");

async function getNotifications(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const data = await notificationService.getNotifications(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const result = await notificationService.markAsRead(userId, req.params.id);
    if (!result) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
