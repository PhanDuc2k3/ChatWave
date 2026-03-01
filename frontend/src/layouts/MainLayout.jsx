import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout({
  children,
  headerContent,
  showSearch = true,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeNav = React.useMemo(() => {
    if (location.pathname.startsWith("/friends")) return "friends";
    if (location.pathname.startsWith("/message")) return "chat";
    if (location.pathname.startsWith("/tasks")) return "tasks";
    if (location.pathname.startsWith("/meeting")) return "meeting";
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
        {/* SUB HEADER WITH SEARCH + PAGE FILTERS - cố định cùng header/sidebar */}
        <div className="shrink-0 bg-white border-b border-[#F5D9A6] px-4 md:px-8 py-3 flex flex-col gap-3">
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

            </div>
        </div>

        {/* MAIN CONTENT - chỉ phần này cuộn */}
        <main className="flex-1 min-h-0 bg-white relative px-4 overflow-auto">
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

