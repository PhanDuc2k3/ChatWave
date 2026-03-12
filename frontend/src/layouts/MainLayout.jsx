import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Header from "./Header";
import Sidebar from "./Sidebar";

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
    if (location.pathname.startsWith("/meeting")) return "meeting";
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
      case "meeting":
        navigate("/meeting");
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

            {/* Floating bot avatar bottom-right, overlapping content */}
            <div className="hidden md:block fixed bottom-6 right-8 pointer-events-auto">
              <div className="w-16 h-16 rounded-full bg-[#E7F3FF] shadow-lg flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#6CB8FF] flex items-center justify-center text-white text-2xl">
                  🤖
                </div>
              </div>
            </div>
        </main>
      </div>
    </div>
  );
}

