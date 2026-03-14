import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
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
    <div className="min-h-screen bg-[#FFF9F2]">
      {/* HEADER - cố định trên cùng */}
      <Header />

      {/* SIDEBAR - cố định bên trái, dưới header */}
      <Sidebar activeNav={activeNav} setActiveNav={handleSetActiveNav} />

      {/* MAIN CONTENT - đẩy xuống dưới header, sang phải sidebar */}
      <div className="pt-16 md:pt-20 sm:pl-16 lg:pl-20 h-screen overflow-hidden flex flex-col">
        {/* MAIN CONTENT - chỉ phần này cuộn */}
        <main className="flex-1 min-h-0 bg-white relative px-0 overflow-auto">
            {children}
        </main>
      </div>
    </div>
  );
}

