import React, { useState, useMemo, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { slides } from "./messageData";
import MessageHeaderControls from "./MessageHeaderControls";
import MessageListSidebar from "./MessageListSidebar";
import MessageContent from "./MessageContent";
import CreateTaskModal from "./CreateTaskModal";
import MessageEmptyState from "./MessageEmptyState";
import { getChatSocket } from "../../socket/chatSocket";
import { messageApi } from "../../api/messageApi";
import { chatGroupApi } from "../../api/chatGroupApi";
import { taskApi } from "../../api/taskApi";
import { friendApi } from "../../api/friendApi";
import toast from "react-hot-toast";

export default function MessagePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [sortOption, setSortOption] = useState("latest");
  const [selectedChat, setSelectedChat] = useState(null);

  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const selectedChatRef = React.useRef(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);

  const currentUserId = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("chatwave_user") || "null");
      return u?.id ?? u?._id ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    const currentUserId = storedUser?.id || storedUser?._id || null;

    const fetchConversations = async () => {
      try {
        const data = await messageApi.getConversations(currentUserId);
        const mapped = (data || []).map((c) => ({
          ...c,
          id: c.id || c._id,
          unreadCount: c.unreadCount ?? 0,
        }));
        setFriends(mapped);
      } catch (err) {
        toast.error(
          err?.message || "Không tải được danh sách cuộc trò chuyện."
        );
      }
    };

    const fetchGroups = async () => {
      if (!currentUserId) return;
      try {
        const data = await chatGroupApi.getMyGroups(currentUserId);
        const mapped = (data || []).map((g) => ({
          id: `group:${g.id || g._id}`,
          chatGroupId: g.id || g._id,
          name: g.name,
          avatar: g.avatar || null,
          message: "Nhóm chat",
          status: "Online",
          lastActive: g.updatedAt
            ? new Date(g.updatedAt).toLocaleDateString("vi-VN")
            : "",
          members: g.members?.length || 1,
          isChatGroup: true,
          unreadCount: 0,
        }));
        setGroups(mapped);
      } catch (err) {
        toast.error(err?.message || "Không tải được danh sách nhóm chat.");
      }
    };

    fetchConversations();
    fetchGroups();
  }, []);

  // Join tất cả conversation rooms để nhận new_message realtime cho list
  useEffect(() => {
    const ids = [
      ...friends.map((f) => f.id),
      ...groups.map((g) => g.id),
    ].filter(Boolean);
    if (ids.length === 0) return;
    const socket = getChatSocket();
    socket.emit("join_conversations", { conversationIds: ids });
  }, [friends, groups]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (!currentUserId) return;
    const socket = getChatSocket();
    const handleNewMessage = (msg) => {
      if (!msg || msg.senderId === String(currentUserId)) return;
      const cid = String(msg.conversationId);
      const isViewing = selectedChatRef.current && String(selectedChatRef.current.id) === cid;
      const lastText = msg.imageUrl ? "[Ảnh]" : (msg.text || "").slice(0, 80);
      const lastTime = msg.createdAt
        ? new Date(msg.createdAt).toLocaleDateString("vi-VN")
        : new Date().toLocaleDateString("vi-VN");
      const updater = (setter, incUnread) => {
        setter((prev) =>
          prev.map((item) => {
            if (String(item.id) !== cid) return item;
            return {
              ...item,
              unreadCount: incUnread ? (item.unreadCount || 0) + 1 : item.unreadCount,
              message: lastText || item.message,
              lastActive: lastTime,
            };
          })
        );
      };
      updater(setGroups, !isViewing);
      updater(setFriends, !isViewing);
      // Toast hiển thị từ MainLayout (global) khi ở mọi trang
    };
    socket.on("new_message", handleNewMessage);
    return () => socket.off("new_message", handleNewMessage);
  }, [currentUserId]);

  const hasConversations = friends.length + groups.length > 0;

  const unread = useMemo(() => {
    const all = [...friends, ...groups].filter((i) => (i.unreadCount || 0) > 0);
    return all.sort((a, b) => {
      const da = a.lastActive || "";
      const db = b.lastActive || "";
      return db.localeCompare(da);
    });
  }, [friends, groups]);

  const listItems = useMemo(() => {
    if (activeTab === "overview") {
      // Gộp friends + groups, sắp xếp theo thời gian mới nhất
      const all = [...friends, ...groups];
      return all.sort((a, b) => {
        const ta = a.lastActive ? new Date(a.lastActive.split("/").reverse().join("-")).getTime() : 0;
        const tb = b.lastActive ? new Date(b.lastActive.split("/").reverse().join("-")).getTime() : 0;
        return tb - ta;
      });
    }
    if (activeTab === "friends") return friends;
    if (activeTab === "groups") return groups;
    if (activeTab === "unread") return unread;
    return [];
  }, [activeTab, friends, groups, unread]);

  const showMembers =
    activeTab === "overview" || activeTab === "groups";

  const handleCreateTaskFromMessage = (taskData) => {
    setShowCreateTask(false);
    toast.success("Đã giao việc thành công.");
  };
  const handleConversationUpdate = (conversationId, lastText, lastTime) => {
    const updater = (items) =>
      items.map((item) =>
        item.id === Number(conversationId) || String(item.id) === String(conversationId)
          ? { ...item, message: lastText, lastActive: lastTime }
          : item
      );

    setFriends((prev) => updater(prev));
    setGroups((prev) => updater(prev));

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
          <>
            {/* MOBILE: list & chi tiết toàn màn hình, chuyển qua lại bằng state */}
            <div className="flex md:hidden h-full min-h-[400px]">
              {!selectedChat ? (
                <div className="w-full bg-white rounded-2xl border border-[#F5D9A6] p-3 overflow-hidden flex flex-col shadow-sm">
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
                      className="text-[11px] px-3 py-1 rounded-full bg-[#F97316] text-white hover:bg-[#EA580C] transition"
                    >
                      + Tạo nhóm
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <MessageListSidebar
                      items={listItems}
                      sortOption={sortOption}
                      selectedId={selectedChat?.id}
                      onSelect={(chat) => {
                        setSelectedChat(chat);
                        if (chat) {
                          const cid = String(chat.id);
                          const markRead = (setter) =>
                            setter((prev) =>
                              prev.map((item) =>
                                String(item.id) === cid
                                  ? { ...item, unreadCount: 0 }
                                  : item
                              )
                            );
                          markRead(setFriends);
                          markRead(setGroups);
                        }
                      }}
                      showMembers={showMembers}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <MessageContent
                    selected={selectedChat}
                    onConversationUpdate={handleConversationUpdate}
                    onOpenCreateTask={() => setShowCreateTask(true)}
                    onLeaveGroup={async (group) => {
                      try {
                        const gid =
                          group.chatGroupId ||
                          String(group.id).replace("group:", "");
                        
                        // Check if it's a delete action
                        if (group._action === "delete") {
                          await chatGroupApi.deleteGroup(gid);
                          setGroups((prev) =>
                            prev.filter(
                              (g) =>
                                g.chatGroupId !== gid && g.id !== group.id
                            )
                          );
                          setSelectedChat(null);
                          toast.success("Đã giải tán nhóm.");
                        } else {
                          // Leave group
                          await chatGroupApi.leaveGroup(gid, currentUserId);
                          setGroups((prev) =>
                            prev.filter(
                              (g) =>
                                g.chatGroupId !== gid && g.id !== group.id
                            )
                          );
                          setSelectedChat(null);
                          toast.success("Đã rời nhóm.");
                        }
                      } catch (err) {
                        toast.error(
                          err?.message || "Không thực hiện được thao tác."
                        );
                      }
                    }}
                    showBackButton
                    onBack={() => setSelectedChat(null)}
                  />
                </div>
              )}
            </div>

            {/* DESKTOP: layout 2 cột như cũ */}
            <div className="hidden md:flex flex-row gap-4 h-full min-h-[400px]">
              {/* Trái: danh sách người nhắn (30%) */}
              <aside className="w-[30%] min-w-[220px] shrink-0 bg-white rounded-2xl border border-[#F5D9A6] p-3 overflow-hidden flex flex-col shadow-sm">
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
                    className="text-[11px] px-3 py-1 rounded-full bg-[#F97316] text-white hover:bg-[#EA580C] transition"
                  >
                    + Tạo nhóm
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <MessageListSidebar
                    items={listItems}
                    sortOption={sortOption}
                    selectedId={selectedChat?.id}
                    onSelect={(chat) => {
                      setSelectedChat(chat);
                      if (chat) {
                        const cid = String(chat.id);
                        const markRead = (setter) =>
                          setter((prev) =>
                            prev.map((item) =>
                              String(item.id) === cid
                                ? { ...item, unreadCount: 0 }
                                : item
                            )
                          );
                        markRead(setFriends);
                        markRead(setGroups);
                      }
                    }}
                    showMembers={showMembers}
                  />
                </div>
              </aside>

              {/* Phải: nội dung tin nhắn (70%) */}
              <section className="flex-1 min-w-0 h-full">
                <MessageContent
                  selected={selectedChat}
                  onConversationUpdate={handleConversationUpdate}
                  onOpenCreateTask={() => setShowCreateTask(true)}
                  onLeaveGroup={async (group) => {
                    try {
                      const gid =
                        group.chatGroupId ||
                        String(group.id).replace("group:", "");

                      if (group._action === "delete") {
                        await chatGroupApi.deleteGroup(gid);
                        setGroups((prev) =>
                          prev.filter(
                            (g) =>
                              g.chatGroupId !== gid && g.id !== group.id
                          )
                        );
                        setSelectedChat(null);
                        toast.success("Đã giải tán nhóm.");
                      } else {
                        await chatGroupApi.leaveGroup(gid, currentUserId);
                        setGroups((prev) =>
                          prev.filter(
                            (g) =>
                              g.chatGroupId !== gid && g.id !== group.id
                          )
                        );
                        setSelectedChat(null);
                        toast.success("Đã rời nhóm.");
                      }
                    } catch (err) {
                      toast.error(
                        err?.message || "Không thực hiện được thao tác."
                      );
                    }
                  }}
                />
              </section>
            </div>
          </>
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
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                Tạo nhóm chat (tin nhắn)
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

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Mời thành viên (tuỳ chọn)
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!currentUserId) return;
                    try {
                      const friends = await friendApi.getFriends(currentUserId);
                      setFriendSuggestions(friends || []);
                    } catch {
                      setFriendSuggestions([]);
                    }
                  }}
                  className="text-xs text-[#FA8DAE] hover:underline"
                >
                  + Chọn từ danh sách bạn bè
                </button>
                {friendSuggestions.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1 border rounded-lg p-2">
                    {friendSuggestions
                      .filter((f) => !invitedMembers.some((m) => m.id === f.id))
                      .map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setInvitedMembers((prev) => [...prev, { id: f.id, username: f.username || f.email }])}
                          className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-100"
                        >
                          + {f.username || f.email}
                        </button>
                      ))}
                  </div>
                )}
                {invitedMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {invitedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FA8DAE]/20 text-xs"
                      >
                        {m.username}
                        <button type="button" onClick={() => setInvitedMembers((prev) => prev.filter((x) => x.id !== m.id))} className="text-gray-500 hover:text-red-600">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                    const group = await chatGroupApi.create({
                      name,
                      description: newGroupDesc.trim(),
                      ownerId,
                      ownerName,
                      members: invitedMembers?.length ? invitedMembers.map((m) => ({ userId: m.id, displayName: m.username || m.name || "User" })) : undefined,
                    });
                    const gid = group.id || group._id;
                    const mapped = {
                      id: `group:${gid}`,
                      chatGroupId: gid,
                      name: group.name,
                      avatar: group.avatar || null,
                      message: "Nhóm chat",
                      status: "Online",
                      lastActive: new Date(group.createdAt).toLocaleDateString(
                        "vi-VN"
                      ),
                      members: group.members?.length || 1,
                      isChatGroup: true,
                    };
                    setGroups((prev) => [mapped, ...prev]);
                    toast.success("Tạo nhóm thành công.");
                    setSelectedChat(mapped);
                    setShowCreateGroup(false);
                    setNewGroupName("");
                    setNewGroupDesc("");
                    setInvitedMembers([]);
                    setFriendSuggestions([]);
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

      {showCreateTask && selectedChat && (
        <CreateTaskModal
          selectedChat={selectedChat}
          currentUserId={currentUserId}
          onClose={() => setShowCreateTask(false)}
          onSuccess={handleCreateTaskFromMessage}
        />
      )}
    </MainLayout>
  );
}
