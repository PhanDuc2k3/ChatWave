import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import logo from "../assets/logo-web.png";

export default function Header() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Đọc thông tin user từ localStorage khi header mount
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
  }, []);

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

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-16 md:h-20 bg-[#F9C96D] flex items-center justify-between pr-4">
      <div className="flex items-center gap-2">
        <img
          src={logo}
          alt="ChatWave logo"
          className="w-20 h-20 object-contain"
        />
        <span className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent">
          ChatWave
        </span>
      </div>

      <div className="relative flex items-center gap-4 text-sm md:text-base" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="hidden sm:flex items-center gap-2 hover:opacity-90 transition rounded-lg py-1 pr-1"
        >
          <div className="w-8 h-8 rounded-full bg-[#FA8DAE] flex items-center justify-center text-white font-semibold">
            {initial}
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
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFF7F0] transition last:rounded-b-xl"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

