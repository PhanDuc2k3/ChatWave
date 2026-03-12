import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, Search } from "lucide-react";
import { authApi } from "../api/authApi";
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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [location.pathname]);

  const displayName =
    currentUser?.username ||
    currentUser?.email ||
    currentUser?.name ||
    "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    setDropdownOpen(false);
    localStorage.removeItem("chatwave_token");
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

      <div className="flex items-center justify-end gap-3 md:gap-4 text-sm md:text-base" ref={dropdownRef}>
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
                    alert("Mật khẩu mới ít nhất 6 ký tự.");
                    return;
                  }
                  if (newPassword !== confirmNewPassword) {
                    alert("Mật khẩu xác nhận không khớp.");
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
                    alert("Đã đổi mật khẩu.");
                  } catch (err) {
                    alert(err?.message || "Không đổi được mật khẩu.");
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

