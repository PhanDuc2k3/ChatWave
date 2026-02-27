import React from "react";

export default function HomeHeaderControls({
  activeTab,
  setActiveTab,
  counts,
  sortOption,
  setSortOption,
}) {
  const { friendsCount, groupsCount, unreadCount } = counts;

  return (
    <>
      <div className="flex items-center gap-6 text-xs md:text-sm lg:text-base font-medium">
        <button
          className={`relative pb-1 ${
            activeTab === "friends" ? "text-[#FF6B8A]" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("friends")}
        >
          Bạn bè{" "}
          <span className="ml-1 text-[#FF6B8A]">{friendsCount}</span>
          {activeTab === "friends" && (
            <span className="absolute left-0 -bottom-0.5 w-full h-[2px] bg-[#FF6B8A]" />
          )}
        </button>
        <button
          className={`relative pb-1 ${
            activeTab === "groups" ? "text-[#FF6B8A]" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("groups")}
        >
          Nhóm{" "}
          <span className="ml-1 text-[#FF6B8A]">{groupsCount}</span>
          {activeTab === "groups" && (
            <span className="absolute left-0 -bottom-0.5 w-full h-[2px] bg-[#FF6B8A]" />
          )}
        </button>
        <button
          className={`relative pb-1 ${
            activeTab === "unread" ? "text-[#FF6B8A]" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("unread")}
        >
          Chưa đọc{" "}
          <span className="ml-1 text-[#FF6B8A]">{unreadCount}</span>
          {activeTab === "unread" && (
            <span className="absolute left-0 -bottom-0.5 w-full h-[2px] bg-[#FF6B8A]" />
          )}
        </button>
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

