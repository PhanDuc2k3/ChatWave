import React from "react";
import {
  Home as HomeIcon,
  MessageCircle,
  Users,
  ClipboardList,
  Video,
  Settings,
} from "lucide-react";
import PropTypes from "prop-types";

export default function Sidebar({ activeNav, setActiveNav }) {
  return (
    <aside className="hidden sm:flex fixed left-0 top-16 md:top-20 bottom-0 z-30 flex-col justify-between items-center w-16 lg:w-20 bg-linear-to-b from-[#F5C46A] to-[#FA8DAE] text-white py-4">
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

          {/* Task - Giao việc */}
          <button
            title="Giao việc"
            onClick={() => setActiveNav("tasks")}
            className={`w-12 h-11 rounded-xl flex items-center justify-center transition-colors ${
              activeNav === "tasks"
                ? "bg-white text-[#FA8DAE] shadow-sm hover:bg-[#f6f6f6]"
                : "border border-white/70 text-white hover:bg-white/20"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
          </button>

          {/* Phòng họp */}
          <button
            title="Phòng họp"
            onClick={() => setActiveNav("meeting")}
            className={`w-12 h-11 rounded-xl flex items-center justify-center transition-colors ${
              activeNav === "meeting"
                ? "bg-white text-[#FA8DAE] shadow-sm hover:bg-[#f6f6f6]"
                : "border border-white/70 text-white hover:bg-white/20"
            }`}
          >
            <Video className="w-5 h-5" />
          </button>
        </nav>
      </div>

      <div className="flex flex-col items-center gap-4 mt-4 pt-4 border-t border-white/30">
        <button
          type="button"
          title="Cài đặt"
          className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  activeNav: PropTypes.string.isRequired,
  setActiveNav: PropTypes.func.isRequired,
};

