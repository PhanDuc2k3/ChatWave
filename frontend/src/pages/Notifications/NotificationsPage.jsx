import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, UserPlus, CheckSquare, Users, ChevronLeft, Check } from "lucide-react";
import { notificationApi } from "../../api/notificationApi";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data || { items: [], total: 0 });
    } catch {
      toast.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => ({
        ...prev,
        items: (prev.items || []).map((it) => ({ ...it, read: true })),
        total: 0,
      }));
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch {
      toast.error("Không thể đánh dấu");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => ({
        ...prev,
        items: (prev.items || []).map((it) =>
          it.id === id ? { ...it, read: true } : it
        ),
        total: Math.max(0, prev.total - 1),
      }));
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.read) {
      handleMarkAsRead(item.id);
    }
    const link = item.link || (item.meta?.groupId ? `/groups/${item.meta.groupId}` : "/");
    navigate(link);
  };

  const getIcon = (type) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="w-5 h-5 text-[#FA8DAE]" />;
      case "task_assigned":
      case "task_status_changed":
        return <CheckSquare className="w-5 h-5 text-[#FA8DAE]" />;
      case "group_join_approved":
        return <Users className="w-5 h-5 text-[#FA8DAE]" />;
      default:
        return <Bell className="w-5 h-5 text-[#FA8DAE]" />;
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Thông báo</h1>
        </div>
        {notifications.items?.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-sm text-[#FA8DAE] hover:underline"
          >
            <Check className="w-4 h-4" />
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FA8DAE]" />
          </div>
        ) : notifications.items?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có thông báo nào</p>
            <p className="text-gray-400 text-sm mt-1">Thông báo sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div>
            {notifications.items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`w-full flex gap-4 px-4 py-4 text-left hover:bg-gray-50 transition border-b border-gray-100 ${
                  !item.read ? "bg-[#FFF7F0]/30" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#FA8DAE]/10 flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>
                  {!item.read && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FA8DAE] rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium truncate ${!item.read ? "text-gray-800" : "text-gray-600"}`}>
                      {item.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">
                      {getTimeAgo(item.createdAt || item.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {item.message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
