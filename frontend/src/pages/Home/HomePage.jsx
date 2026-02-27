import React, { useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  slides,
  initialFriends,
  initialGroups,
  initialUnread,
} from "./homeData";
import HomeHeaderControls from "./HomeHeaderControls";
import HomeListGrid from "./HomeListGrid";
import HomeEmptyState from "./HomeEmptyState";

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("friends"); // friends | groups | unread
  const [sortOption, setSortOption] = useState("latest"); // latest | oldest | mostMessages

  // Tạm thời mock dữ liệu để demo giao diện
  const [friends] = useState(initialFriends);
  const [groups] = useState(initialGroups);
  const [unread] = useState(initialUnread);

  const hasFriends = friends.length > 0;

  const headerContent = hasFriends ? (
    <HomeHeaderControls
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
            {activeTab === "friends" && (
              <HomeListGrid items={friends} sortOption={sortOption} />
            )}
            {activeTab === "groups" && (
              <HomeListGrid
                items={groups}
                sortOption={sortOption}
                showMembers
              />
            )}
            {activeTab === "unread" && (
              <HomeListGrid
                items={unread}
                sortOption={sortOption}
                showUnreadBadge
              />
            )}
          </div>
        ) : (
          <HomeEmptyState
            slides={slides}
            activeSlide={activeSlide}
            setActiveSlide={setActiveSlide}
          />
        )}
      </div>
    </MainLayout>
  );
}

