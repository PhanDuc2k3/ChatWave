import React, { useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  slides,
  initialFriends,
  initialGroups,
  initialUnread,
} from "./messageData";
import MessageHeaderControls from "./MessageHeaderControls";
import MessageListGrid from "./MessageListGrid";
import MessageEmptyState from "./MessageEmptyState";

export default function MessagePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("overview"); // overview | unread | friends | groups
  const [sortOption, setSortOption] = useState("latest"); // latest | oldest | mostMessages

  // Tạm thời mock dữ liệu để demo giao diện
  const [friends] = useState(initialFriends);
  const [groups] = useState(initialGroups);
  const [unread] = useState(initialUnread);

  const hasFriends = friends.length > 0;

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
      <div className="w-full">
        {hasFriends ? (
          <div className="w-full px-0 md:px-4">
            {activeTab === "overview" && (
              <MessageListGrid
                items={[...friends, ...groups]}
                sortOption={sortOption}
                showMembers
              />
            )}
            {activeTab === "friends" && (
              <MessageListGrid items={friends} sortOption={sortOption} />
            )}
            {activeTab === "groups" && (
              <MessageListGrid
                items={groups}
                sortOption={sortOption}
                showMembers
              />
            )}
            {activeTab === "unread" && (
              <MessageListGrid
                items={unread}
                sortOption={sortOption}
                showUnreadBadge
              />
            )}
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

