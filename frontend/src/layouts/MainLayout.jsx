import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout({
  children,
  headerContent,
  showSearch = true,
  showHeaderActions = true,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeNav = React.useMemo(() => {
    if (location.pathname.startsWith("/friends")) return "friends";
    if (location.pathname.startsWith("/message")) return "chat";
    if (location.pathname.startsWith("/tasks")) return "tasks";
    return "home";
  }, [location.pathname]);

  const handleSetActiveNav = (target) => {
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
      case "tasks":
        navigate("/tasks");
        break;
      case "notifications":
        navigate("/notifications");
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F2]">
      {/* HEADER FULL WIDTH */}
      <Header />

      {/* BELOW HEADER: SIDEBAR + MAIN */}
      <div className="flex flex-1">
        {/* LEFT SIDEBAR STARTING UNDER HEADER */}
        <Sidebar activeNav={activeNav} setActiveNav={handleSetActiveNav} />

        {/* MAIN AREA TO THE RIGHT OF SIDEBAR */}
        <div className="flex-1 flex flex-col">
          {/* SUB HEADER WITH SEARCH + PAGE FILTERS */}
          <div className="bg-white border-b border-[#F5D9A6] px-4 md:px-8 py-3 flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {showSearch && (
                <div className="flex items-center bg-white shadow-sm rounded-full px-4 py-2 w-full md:max-w-md">
                  <i className="fas fa-search text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm"
                    className="flex-1 bg-transparent outline-none text-sm md:text-base"
                  />
                </div>
              )}

              {/* Custom header content from each page (ví dụ: Bạn bè/Nhóm/Chưa đọc + Sắp xếp) */}
              {headerContent && (
                <div className="flex-1 flex items-center justify-between gap-4">
                  {headerContent}
                </div>
              )}

              {showHeaderActions && (
                <div className="hidden md:flex items-center gap-3 text-xl text-[#F89A8C]">
                  <button className="w-9 h-9 rounded-full bg-[#FFE6DD] flex items-center justify-center hover:bg-[#ffd3c4]">
                    <i className="fas fa-folder-open" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-[#FFE6DD] flex items-center justify-center hover:bg-[#ffd3c4]">
                    <i className="fas fa-comment-dots" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-[#FFE6DD] flex items-center justify-center hover:bg-[#ffd3c4]">
                    <i className="fas fa-user-friends" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-[#FFE6DD] flex items-center justify-center hover:bg-[#ffd3c4]">
                    <i className="fas fa-globe" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MAIN CONTENT + FLOATING CHATBOT LOGO */}
          <main className="flex-1 bg-white relative px-4 overflow-auto">
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
    </div>
  );
}

