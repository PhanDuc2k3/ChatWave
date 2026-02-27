import React from "react";
import { LayoutDashboard, BellDot, User, Users } from "lucide-react";

export default function MessageHeaderControls({
  activeTab,
  setActiveTab,
  counts,
  sortOption,
  setSortOption,
}) {
  const { friendsCount, groupsCount, unreadCount } = counts;

  const baseBtnClasses =
    "relative pb-1 flex flex-col items-center gap-1 text-xs md:text-sm lg:text-base";

  const renderIconButton = (key, IconComponent, count, label) => {
    const isActive = activeTab === key;

    return (
      <button
        key={key}
        type="button"
        className={`${baseBtnClasses} ${
          isActive ? "text-[#FF6B8A]" : "text-gray-500"
        }`}
        onClick={() => setActiveTab(key)}
        aria-label={label}
      >
        <div className="relative flex items-center justify-center">
          <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
          {typeof count === "number" && count > 0 && (
            <span className="absolute -right-2 -top-2 min-w-[18px] px-1 rounded-full bg-[#FF6B8A] text-white text-[10px] leading-4 text-center">
              {count}
            </span>
          )}
        </div>
        {isActive && (
          <span className="absolute left-0 -bottom-0.5 w-full h-[2px] bg-[#FF6B8A]" />
        )}
      </button>
    );
  };

  return (
    <>
      <div className="flex items-center gap-4 md:gap-6">
        {renderIconButton("overview", LayoutDashboard, null, "Tổng quát")}
        {renderIconButton("unread", BellDot, unreadCount, "Tin nhắn chưa đọc")}
        {renderIconButton("friends", User, friendsCount, "Bạn bè")}
        {renderIconButton("groups", Users, groupsCount, "Nhóm")}
      </div>

      <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
        <span className="hidden md:inline">Sắp xếp</span>
        <div className="relative">
          <select
            className="appearance-none pl-3 pr-8 py-1 rounded-full border border-[#F5D9A6] text-[#FF6B8A] bg-white text-xs md:text-sm focus:outline-none"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="latest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="mostMessages">Nhắn tin nhiều nhất</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#FF6B8A]">
            <i className="fas fa-chevron-down" />
          </span>
        </div>
      </div>
    </>
  );
}

