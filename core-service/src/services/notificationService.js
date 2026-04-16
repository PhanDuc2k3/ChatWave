const friendService = require("./friendService");
const taskService = require("./taskService");
const Notification = require("../models/Notification");
const NotificationReadState = require("../models/NotificationReadState");

function toId(doc) {
  if (!doc) return doc;
  const o = { ...doc };
  if (o._id && !o.id) o.id = o._id;
  return o;
}

async function getNotifications(userId) {
  const uid = String(userId);
  const [friendData, tasks, notifications] = await Promise.all([
    friendService.getRequests(uid).catch(() => ({ incoming: [], outgoing: [] })),
    taskService.getByAssignee(uid).catch(() => []),
    Notification.find({ userId: uid }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const friendRequests = (friendData?.incoming || []).map((r) => ({
    id: r.id,
    type: "friend_request",
    title: "Lời mời kết bạn",
    message: `${r.otherUserName} muốn kết bạn với bạn`,
    link: "/friends/requests",
    createdAt: r.createdAt,
    read: false,
    meta: r,
  }));

  const taskItems = (tasks || [])
    .filter((t) => t.status === "pending" || t.status === "in_progress")
    .slice(0, 10)
    .map((t) => ({
      id: t.id || t._id,
      type: "task_assigned",
      title: "Task mới",
      message: t.title || "Bạn được giao task",
      link: `/tasks`,
      createdAt: t.createdAt,
      read: false,
      meta: t,
    }));

  const notifItems = (notifications || []).map((n) => toId({ ...n, id: n._id }));

  let all = [...friendRequests, ...taskItems, ...notifItems].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const readState = await NotificationReadState.findOne({ userId: uid }).lean();
  const lastReadAt = readState?.lastReadAt ? new Date(readState.lastReadAt) : null;
  if (lastReadAt) {
    all = all.filter((it) => new Date(it.createdAt || 0) > lastReadAt);
  }

  return {
    items: all.slice(0, 20),
    counts: {
      friendRequests: friendRequests.length,
      tasks: taskItems.length,
      groupJoinApproved: notifItems.filter((n) => n.type === "group_join_approved").length,
    },
    total: all.length,
  };
}

async function markAsRead(userId, notificationId) {
  const n = await Notification.findOne({
    _id: notificationId,
    userId: String(userId),
  });
  if (!n) return null;
  n.read = true;
  await n.save();
  return n.toObject ? n.toObject() : n;
}

async function markAllAsRead(userId) {
  const uid = String(userId);
  await Notification.updateMany({ userId: uid }, { $set: { read: true } });
  await NotificationReadState.findOneAndUpdate(
    { userId: uid },
    { $set: { lastReadAt: new Date() } },
    { upsert: true }
  );
  return { success: true };
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  create: async ({ userId, type, title, message, link = "/", meta = {} }) => {
    const notif = new Notification({
      userId: String(userId),
      type,
      title: title || "",
      message: message || "",
      link,
      meta,
      read: false,
    });
    await notif.save();
    return notif.toObject ? notif.toObject() : notif;
  },
};
