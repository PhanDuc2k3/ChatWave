import React, { useState, useMemo, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import { slides } from "./messageData";
import MessageHeaderControls from "./MessageHeaderControls";
import MessageListSidebar from "./MessageListSidebar";
import MessageContent from "./MessageContent";
import MessageEmptyState from "./MessageEmptyState";
import { messageApi } from "../../api/messageApi";
import { groupApi } from "../../api/groupApi";
import toast from "react-hot-toast";

export default function MessagePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [sortOption, setSortOption] = useState("latest");
  const [selectedChat, setSelectedChat] = useState(null);

  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [unread] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    const currentUserId = storedUser?.id || storedUser?._id || null;

    const fetchConversations = async () => {
      try {
        const data = await messageApi.getConversations(currentUserId);
        setFriends(data || []);
      } catch (err) {
        toast.error(
          err?.message || "Không tải được danh sách cuộc trò chuyện."
        );
      }
    };

    const fetchGroups = async () => {
      if (!currentUserId) return;
      try {
        const data = await groupApi.getMyGroups(currentUserId);
        const mapped = (data || []).map((g) => ({
          id: g.id,
          name: g.name,
          message: g.lastMessage || "Nhóm mới",
          status: "Online",
          lastActive: g.updatedAt
            ? new Date(g.updatedAt).toLocaleDateString("vi-VN")
            : "",
          members: g.members?.length || 1,
        }));
        setGroups(mapped);
      } catch (err) {
        toast.error(err?.message || "Không tải được danh sách nhóm.");
      }
    };

    fetchConversations();
    fetchGroups();
  }, []);

  const hasConversations = friends.length + groups.length > 0;

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

  const handleConversationUpdate = (conversationId, lastText, lastTime) => {
    const updater = (items) =>
      items.map((item) =>
        item.id === Number(conversationId) || String(item.id) === String(conversationId)
          ? { ...item, message: lastText, lastActive: lastTime }
          : item
      );

    setFriends((prev) => updater(prev));
    setGroups((prev) => updater(prev));
    setUnread((prev) => updater(prev));

    setSelectedChat((prev) =>
      prev && (prev.id === Number(conversationId) || String(prev.id) === String(conversationId))
        ? { ...prev, message: lastText, lastActive: lastTime }
        : prev
    );
  };

  const headerContent = hasConversations ? (
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
        {hasConversations ? (
          <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
            {/* Trái: danh sách người nhắn (30%) */}
            <aside className="w-[30%] min-w-[200px] shrink-0 bg-white rounded-2xl border border-gray-200 p-3 overflow-hidden flex flex-col">
              <div className="mb-3 shrink-0 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Tin nhắn
                  </h3>
                  <p className="text-xs text-gray-500">
                    {listItems.length} cuộc trò chuyện
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="text-[11px] px-2 py-1 rounded-full bg-[#F9C96D] text-gray-800 hover:bg-[#F7B944] transition"
                >
                  + Tạo nhóm
                </button>
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
              <MessageContent
                selected={selectedChat}
                onConversationUpdate={handleConversationUpdate}
              />
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

      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-3">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                Tạo nhóm chat mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-500 hover:text-gray-700 text-lg px-2"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
                  placeholder="VD: Nhóm làm việc A"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Mô tả (tuỳ chọn)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] resize-none min-h-[70px]"
                  placeholder="Mô tả ngắn gọn về mục đích nhóm"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="px-3 py-1.5 text-xs rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={creatingGroup}
                onClick={async () => {
                  const name = newGroupName.trim();
                  if (!name) {
                    toast.error("Vui lòng nhập tên nhóm.");
                    return;
                  }
                  const storedUser =
                    JSON.parse(
                      localStorage.getItem("chatwave_user") || "null"
                    ) || null;
                  const ownerId = storedUser?.id || storedUser?._id;
                  const ownerName =
                    storedUser?.username ||
                    storedUser?.email ||
                    storedUser?.name ||
                    "Bạn";
                  if (!ownerId) {
                    toast.error("Bạn cần đăng nhập để tạo nhóm.");
                    return;
                  }
                  try {
                    setCreatingGroup(true);
                    const group = await groupApi.create({
                      name,
                      description: newGroupDesc.trim(),
                      ownerId,
                      ownerName,
                    });
                    const mapped = {
                      id: group.id,
                      name: group.name,
                      message: newGroupDesc.trim() || "Nhóm mới",
                      status: "Online",
                      lastActive: new Date(group.createdAt).toLocaleDateString(
                        "vi-VN"
                      ),
                      members: group.members?.length || 1,
                    };
                    setGroups((prev) => [mapped, ...prev]);
                    toast.success("Tạo nhóm thành công.");
                    setSelectedChat(mapped);
                    setShowCreateGroup(false);
                    setNewGroupName("");
                    setNewGroupDesc("");
                  } catch (err) {
                    toast.error(
                      err?.message || "Không tạo được nhóm, vui lòng thử lại."
                    );
                  } finally {
                    setCreatingGroup(false);
                  }
                }}
                className="px-4 py-1.5 text-xs rounded-full bg-[#FA8DAE] text-white font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingGroup ? "Đang tạo..." : "Tạo nhóm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
