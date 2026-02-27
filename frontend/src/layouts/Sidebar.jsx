import React from "react";
import {
  Home as HomeIcon,
  MessageCircle,
  Users,
  Newspaper,
  Bell,
} from "lucide-react";
import PropTypes from "prop-types";

export default function Sidebar({ activeNav, setActiveNav }) {
  return (
    <aside className="hidden sm:flex flex-col justify-between items-center w-16 lg:w-20 bg-linear-to-b from-[#F5C46A] to-[#FA8DAE] text-white py-4">
      <div className="flex flex-col items-center gap-4">
        <nav className="flex flex-col items-center gap-4">
          {/* Home */}
          <button
            title="Trang chủ"
            onClick={() => setActiveNav("home")}
            className={`w-12 h-11 rounded-xl flex items-center justify-center transition-colors ${
              activeNav === "home"
                ? "bg-white text-[#FA8DAE] shadow-sm hover:bg-[#f6f6f6]"
                : "border border-white/70 text-white hover:bg-white/20"
            }`}
          >
            <HomeIcon className="w-5 h-5" />
          </button>

          {/* Chat */}
          <button
            title="Nhắn tin"
            onClick={() => setActiveNav("chat")}
            className={`w-12 h-11 rounded-xl flex items-center justify-center transition-colors ${
              activeNav === "chat"
                ? "bg-white text-[#FA8DAE] shadow-sm hover:bg-[#f6f6f6]"
                : "border border-white/70 text-white hover:bg-white/20"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          {/* Friends */}
          <button
            title="Bạn bè"
            onClick={() => setActiveNav("friends")}
            className={`w-12 h-11 rounded-xl flex items-center justify-center transition-colors ${
              activeNav === "friends"
                ? "bg-white text-[#FA8DAE] shadow-sm hover:bg-[#f6f6f6]"
                : "border border-white/70 text-white hover:bg-white/20"
            }`}
          >
            <Users className="w-5 h-5" />
          </button>

          {/* News */}
          <button
            title="Tin tức"
            onClick={() => setActiveNav("news")}
            className={`w-12 h-11 rounded-xl flex items-center justify-center transition-colors ${
              activeNav === "news"
                ? "bg-white text-[#FA8DAE] shadow-sm hover:bg-[#f6f6f6]"
                : "border border-white/70 text-white hover:bg-white/20"
            }`}
          >
            <Newspaper className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            title="Thông báo"
            onClick={() => setActiveNav("notifications")}
            className={`w-12 h-11 rounded-xl flex items-center justify-center transition-colors ${
              activeNav === "notifications"
                ? "bg-white text-[#FA8DAE] shadow-sm hover:bg-[#f6f6f6]"
                : "border border-white/70 text-white hover:bg-white/20"
            }`}
          >
            <Bell className="w-5 h-5" />
          </button>
        </nav>
      </div>

      <div className="flex flex-col items-center gap-4 text-xl mt-4">
        <button className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30">
          <i className="fas fa-th-large" />
        </button>
        <button className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30">
          <i className="fas fa-cog" />
        </button>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  activeNav: PropTypes.string.isRequired,
  setActiveNav: PropTypes.func.isRequired,
};

