import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  MessageCircle,
  Users,
  UserCircle,
  ClipboardList,
  Bot,
} from "lucide-react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { getChatSocket } from "../socket/chatSocket";
import { messageApi } from "../api/messageApi";
import { chatGroupApi } from "../api/chatGroupApi";
import toast from "react-hot-toast";

export default function MainLayout({
  children,
  headerContent,
  showSearch = true,
  hideBottomNav = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("chatwave_user") || "null");
    } catch {
      return null;
    }
  }, []);
  const isGuest = !currentUser;
  const currentUserId = currentUser?.id || currentUser?._id || null;

  // State cho notification banner tin nhắn mới (mobile)
  const [newMessageNotif, setNewMessageNotif] = useState(null);
  const newMessageTimeoutRef = useRef(null);

  // Thông báo tin nhắn mới khi ở bất kỳ trang nào (Home, Profile, ...)
  useEffect(() => {
    if (isGuest || !currentUserId) return;
    const socket = getChatSocket();

    const fetchAndJoin = async () => {
      try {
        const [convRes, groupsRes] = await Promise.all([
          messageApi.getConversations(currentUserId),
          chatGroupApi.getMyGroups(currentUserId),
        ]);
        const friendIds = (convRes || []).map((c) => c.id || c._id).filter(Boolean);
        const groupIds = (groupsRes || []).map(
          (g) => `group:${g.id || g._id}`
        );
        const ids = [...friendIds, ...groupIds];
        if (ids.length > 0) {
          socket.emit("join_conversations", { conversationIds: ids });
        }
      } catch {
        // ignore
      }
    };
    fetchAndJoin();

    const handleNewMessage = (msg) => {
      if (!msg || msg.senderId === String(currentUserId)) return;
      const preview = msg.imageUrl ? "[Ảnh]" : (msg.text || "").slice(0, 80);
      const sender = msg.senderName || "Ai đó";
      const content = `${sender}: ${preview || "Tin nhắn mới"}`;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // Mobile: hiện notification banner ở header
        if (newMessageTimeoutRef.current) {
          clearTimeout(newMessageTimeoutRef.current);
        }
        setNewMessageNotif({
          id: Date.now(),
          sender,
          preview: preview || "Tin nhắn mới",
          conversationId: msg.conversationId,
        });
        newMessageTimeoutRef.current = setTimeout(() => {
          setNewMessageNotif(null);
        }, 4000);
      } else {
        // Desktop: hiện toast
        toast(
          <div className="min-w-[360px] max-w-[420px]">
            <p className="text-sm font-semibold text-gray-800 mb-1">
              Thông báo tin nhắn mới
            </p>
            <p className="text-sm text-gray-600 truncate" title={content}>
              {content}
            </p>
          </div>,
          {
            position: "bottom-right",
            duration: 4000,
            icon: false,
          }
        );
      }
    };

    socket.on("new_message", handleNewMessage);
    return () => socket.off("new_message", handleNewMessage);
  }, [currentUserId, isGuest]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    const q = (searchQuery || "").trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const activeNav = React.useMemo(() => {
    if (location.pathname.startsWith("/search")) return "search";
    if (location.pathname.startsWith("/friends")) return "friends";
    if (location.pathname.startsWith("/groups")) return "groups";
    if (location.pathname.startsWith("/message")) return "chat";
    if (location.pathname.startsWith("/tasks")) return "tasks";
    if (location.pathname.startsWith("/chatbot")) return "chatbot";
    return "home";
  }, [location.pathname]);

  const handleSetActiveNav = (target) => {
    if (isGuest && target !== "home" && target !== "search") {
      navigate("/login");
      return;
    }
    switch (target) {
      case "home":
        navigate("/");
        break;
      case "chat":
        navigate("/message");
        break;
      case "friends":
        navigate("/friends");
        break;
      case "search":
        navigate("/search");
        break;
      case "groups":
        navigate("/groups");
        break;
      case "tasks":
        navigate("/tasks");
        break;
      case "chatbot":
        navigate("/chatbot");
        break;
      case "notifications":
        navigate("/notifications");
        break;
      default:
        break;
    }
  };

  return (
    <div className={`h-screen overflow-hidden bg-[#FFF9F2] ${hideBottomNav ? '' : 'pb-14'}`}>
      {/* HEADER - cố định trên cùng */}
      <Header newMessageNotif={newMessageNotif} onCloseMessageNotif={() => setNewMessageNotif(null)} />

      {/* SIDEBAR - cố định bên trái, dưới header (desktop / tablet) */}
      <Sidebar activeNav={activeNav} setActiveNav={handleSetActiveNav} />

      {/* BOTTOM NAV - cho mobile (ẩn trên md) - ẩn khi hideBottomNav=true */}
      {!hideBottomNav && (
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 border-t border-gray-200 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-1.5 flex items-center justify-between gap-1 text-xs">
          <button
            type="button"
            onClick={() => handleSetActiveNav("home")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl ${
              activeNav === "home"
                ? "text-[#FA8DAE] bg-[#FFF1F2]"
                : "text-gray-500"
            }`}
          >
            <HomeIcon className="w-5 h-5 mb-0.5" />
            <span>Trang chủ</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetActiveNav("chat")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl ${
              activeNav === "chat"
                ? "text-[#FA8DAE] bg-[#FFF1F2]"
                : "text-gray-500"
            }`}
          >
            <MessageCircle className="w-5 h-5 mb-0.5" />
            <span>Nhắn tin</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetActiveNav("groups")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl ${
              activeNav === "groups"
                ? "text-[#FA8DAE] bg-[#FFF1F2]"
                : "text-gray-500"
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Nhóm</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetActiveNav("friends")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl ${
              activeNav === "friends"
                ? "text-[#FA8DAE] bg-[#FFF1F2]"
                : "text-gray-500"
            }`}
          >
            <UserCircle className="w-5 h-5 mb-0.5" />
            <span>Bạn bè</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetActiveNav("tasks")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl ${
              activeNav === "tasks"
                ? "text-[#FA8DAE] bg-[#FFF1F2]"
                : "text-gray-500"
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span>Giao việc</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetActiveNav("chatbot")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl ${
              activeNav === "chatbot"
                ? "text-[#FA8DAE] bg-[#FFF1F2]"
                : "text-gray-500"
            }`}
          >
            <Bot className="w-5 h-5 mb-0.5" />
            <span>Chatbot</span>
          </button>
        </div>
      </nav>
      )}

      {/* MAIN CONTENT - đẩy xuống dưới header, sang phải sidebar */}
      <div className={`min-h-screen bg-white transition-all duration-300 ${newMessageNotif ? 'pt-[calc(3rem+64px)] md:pt-20' : 'pt-16 md:pt-20'} sm:pl-16 lg:pl-20`}>
        <main className="h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

