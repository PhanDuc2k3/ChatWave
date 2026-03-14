import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, Search, Bell, Users, CheckSquare, UserPlus } from "lucide-react";
import { authApi } from "../api/authApi";
import toast from "react-hot-toast";
import { notificationApi } from "../api/notificationApi";
import { getApiMessage } from "../utils/api";
import logo from "../assets/logo-web.png";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [notifications, setNotifications] = useState({ items: [], total: 0 });
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("chatwave_user");
      if (raw) {
        setCurrentUser(JSON.parse(raw));
      }
    } catch {
      // ignore parse error
    }

    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [location.pathname]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("chatwave_token");
    if (!token) return;
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data || { items: [], total: 0 });
    } catch {
      setNotifications({ items: [], total: 0 });
    }
  };

  useEffect(() => {
    if (currentUser) fetchNotifications();
  }, [currentUser]);

  const displayName =
    currentUser?.username ||
    currentUser?.email ||
    currentUser?.name ||
    "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    setDropdownOpen(false);
    localStorage.removeItem("chatwave_token");
    localStorage.removeItem("chatwave_refresh_token");
    localStorage.removeItem("chatwave_user");
    navigate("/login");
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    navigate("/profile");
  };

  const handleOpenChangePassword = () => {
    setDropdownOpen(false);
    setShowChangePassword(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    const q = (searchQuery || "").trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-16 md:h-20 bg-[#F9C96D] flex items-center justify-between px-3 md:px-4">
      <div className="flex items-center gap-2 md:gap-3 flex-1">
        <img
          src={logo}
          alt="ChatWave logo"
          className="w-20 h-20 object-contain"
        />
        <form
          onSubmit={handleSearchSubmit}
          className="hidden sm:flex items-center bg-white/90 rounded-full px-3 py-1.5 max-w-md w-full shadow-sm border border-white/50"
        >
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm nhóm, bài viết, người dùng..."
            className="flex-1 bg-transparent outline-none text-xs md:text-sm text-gray-700"
          />
        </form>
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-3 text-sm md:text-base">
        {currentUser && (
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-full hover:bg-white/50 transition"
              title="Thông báo"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {notifications.total > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-[#FA8DAE] text-white rounded-full">
                  {notifications.total > 9 ? "9+" : notifications.total}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-[360px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <span className="font-semibold text-gray-800">Thông báo</span>
                  {(notifications.items?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await notificationApi.markAllAsRead();
                          setNotifications((prev) => ({
                            ...prev,
                            items: (prev.items || []).map((it) => ({
                              ...it,
                              read: true,
                            })),
                            total: 0,
                          }));
                        } catch { /* ignore */ }
                      }}
                      className="text-xs text-[#FA8DAE] hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {!notifications.items?.length ? (
                    <p className="p-4 text-center text-gray-500 text-sm">Chưa có thông báo</p>
                  ) : (
                    notifications.items.map((item) => {
                      const Icon =
                        item.type === "friend_request"
                          ? UserPlus
                          : item.type === "task_assigned" || item.type === "task_status_changed"
                          ? CheckSquare
                          : item.type === "group_join_approved"
                          ? Users
                          : Bell;
                      const link = item.link || (item.meta?.groupId ? `/groups/${item.meta.groupId}` : "/");
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            navigate(link);
                            if (item.type === "group_join_approved" && item.id) {
                              notificationApi.markAsRead(item.id).catch(() => {});
                              fetchNotifications();
                            }
                          }}
                          className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${!item.read ? "bg-[#FFF7F0]/50" : ""}`}
                        >
                          <div className="w-9 h-9 rounded-full bg-[#FA8DAE]/20 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-[#FA8DAE]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 truncate">{item.message}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="hidden sm:flex items-center gap-2 hover:opacity-90 transition rounded-lg py-1 pr-1"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FA8DAE] flex items-center justify-center text-white font-semibold shrink-0">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <span className="font-medium text-gray-800 text-sm md:text-base max-w-[140px] truncate">
            {displayName}
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <button
              type="button"
              onClick={handleProfile}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFF7F0] transition first:rounded-t-xl"
            >
              <User className="w-4 h-4 text-[#FA8DAE]" />
              Trang cá nhân
            </button>
            <button
              type="button"
              onClick={handleOpenChangePassword}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFF7F0] transition"
            >
              <span className="w-2 h-2 rounded-full bg-[#FA8DAE]" />
              Đổi mật khẩu
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFF7F0] transition last:rounded-b-xl"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
              Đăng xuất
            </button>
          </div>
        )}
        </div>
      </div>

      {showChangePassword && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Đổi mật khẩu</h3>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mật khẩu hiện tại"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!currentUser?.id && !currentUser?._id) return;
                  if (newPassword.length < 6) {
                    toast.error("Mật khẩu mới ít nhất 6 ký tự.");
                    return;
                  }
                  if (!/[a-zA-Z]/.test(newPassword)) {
                    toast.error("Mật khẩu cần có ít nhất 1 chữ cái.");
                    return;
                  }
                  if (!/[0-9]/.test(newPassword)) {
                    toast.error("Mật khẩu cần có ít nhất 1 chữ số.");
                    return;
                  }
                  if (newPassword !== confirmNewPassword) {
                    toast.error("Mật khẩu xác nhận không khớp.");
                    return;
                  }
                  try {
                    const userId = currentUser.id || currentUser._id;
                    await authApi.changePassword(
                      userId,
                      currentPassword,
                      newPassword
                    );
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    toast.success("Đã đổi mật khẩu.");
                  } catch (err) {
                    toast.error(getApiMessage(err, "Không đổi được mật khẩu."));
                  }
                }}
                className="px-4 py-2 bg-[#FA8DAE] text-white rounded-lg text-sm font-medium"
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

