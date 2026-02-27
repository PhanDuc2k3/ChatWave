import React, { useState, useMemo } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  slides,
  initialFriends,
  initialGroups,
  initialUnread,
} from "./messageData";
import MessageHeaderControls from "./MessageHeaderControls";
import MessageListSidebar from "./MessageListSidebar";
import MessageContent from "./MessageContent";
import MessageEmptyState from "./MessageEmptyState";

export default function MessagePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [sortOption, setSortOption] = useState("latest");
  const [selectedChat, setSelectedChat] = useState(null);

  const [friends] = useState(initialFriends);
  const [groups] = useState(initialGroups);
  const [unread] = useState(initialUnread);

  const hasFriends = friends.length > 0;

  const listItems = useMemo(() => {
    if (activeTab === "overview") return [...friends, ...groups];
    if (activeTab === "friends") return friends;
    if (activeTab === "groups") return groups;
    if (activeTab === "unread") return unread;
    return [];
  }, [activeTab, friends, groups, unread]);

  const showMembers =
    activeTab === "overview" || activeTab === "groups";
  const showUnreadBadge = activeTab === "unread";

  const headerContent = hasFriends ? (
    <MessageHeaderControls
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      sortOption={sortOption}
      setSortOption={setSortOption}
      counts={{
        friendsCount: friends.length,
        groupsCount: groups.length,
        unreadCount: unread.length,
      }}
    />
  ) : null;

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full h-full">
        {hasFriends ? (
          <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
            {/* Trái: danh sách người nhắn (30%) */}
            <aside className="w-[30%] min-w-[200px] shrink-0 bg-white rounded-2xl border border-gray-200 p-3 overflow-hidden flex flex-col">
              <div className="mb-3 shrink-0">
                <h3 className="text-sm font-semibold text-gray-800">
                  Tin nhắn
                </h3>
                <p className="text-xs text-gray-500">
                  {listItems.length} cuộc trò chuyện
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <MessageListSidebar
                  items={listItems}
                  sortOption={sortOption}
                  selectedId={selectedChat?.id}
                  onSelect={setSelectedChat}
                  showMembers={showMembers}
                  showUnreadBadge={showUnreadBadge}
                />
              </div>
            </aside>

            {/* Phải: nội dung tin nhắn (70%) */}
            <section className="flex-1 min-w-0">
              <MessageContent selected={selectedChat} />
            </section>
          </div>
        ) : (
          <MessageEmptyState
            slides={slides}
            activeSlide={activeSlide}
            setActiveSlide={setActiveSlide}
          />
        )}
      </div>
    </MainLayout>
  );
}
