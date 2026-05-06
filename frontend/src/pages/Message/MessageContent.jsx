import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  ClipboardList,
  Smile,
  Video,
  MoreHorizontal,
  Pencil,
  Trash2,
  Info,
  User,
  Bell,
  BellOff,
  Search,
  ImagePlus,
  X,
  Crown,
  UserMinus,
  ArrowLeft,
  Image,
  FileText,
  Download,
  ZoomIn,
  FolderOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";
import { getChatSocket } from "../../socket/chatSocket";
import { uploadApi } from "../../api/uploadApi";
import VideoCallRoom from "../../components/VideoCallRoom";
import { messageApi } from "../../api/messageApi";
import { postApi } from "../../api/postApi";
import { chatGroupApi } from "../../api/chatGroupApi";
import HomePostCard from "../Home/HomePostCard";

const CHAT_GROUP_ROLE_LABELS = {
  leader: "Trưởng nhóm",
  admin: "Phó nhóm",
  member: "Thành viên",
};

export default function MessageContent({
  selected,
  onConversationUpdate,
  onOpenCreateTask,
  onLeaveGroup,
  showBackButton = false,
  onBack = null,
}) {
  const { confirm } = useConfirm();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  // Trạng thái thông báo
  const [notificationsMuted, setNotificationsMuted] = useState(false);

  // Modal tìm kiếm tin nhắn
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Modal chuyển quyền trưởng nhóm
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Modal media/files
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const EMOJI_LIST = [
    "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "🙂", "🙃", "😉",
    "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😋", "😛", "😜",
    "🤪", "😝", "🤑", "🤗", "🤭", "🤔", "🤐", "😐", "😑", "😶",
    "😏", "😒", "🙄", "😬", "😌", "😔", "😪", "🤤", "😴", "😷",
    "👍", "👎", "👏", "🙌", "🤝", "🙏", "✌", "🤞", "🤟", "🤘",
    "👋", "💪", "❤", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
    "💔", "❣", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "🔥",
    "⭐", "🌟", "✨", "💫", "🎉", "🎊", "🎈", "🎁", "🏆", "✅",
  ];

  const storedUser =
    JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  const currentUserId = storedUser?.id || storedUser?._id || "me";
  const currentUserName =
    storedUser?.username || storedUser?.email || storedUser?.name || "Bạn";

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      setGroupDetails(null);
      return;
    }
    if (!selected.isChatGroup || !selected.chatGroupId) {
      setGroupDetails(null);
    }
  }, [selected?.id, selected?.isChatGroup, selected?.chatGroupId]);

  useEffect(() => {
    if (!selected?.isChatGroup || !selected?.chatGroupId || !showInfo) {
      return;
    }
    let cancelled = false;
    chatGroupApi
      .getById(selected.chatGroupId)
      .then((data) => {
        if (!cancelled) setGroupDetails(data);
      })
      .catch(() => {
        if (!cancelled) setGroupDetails(null);
      });
    return () => { cancelled = true; };
  }, [selected?.chatGroupId, showInfo]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }

    const conversationId = String(selected.id);
    let isMounted = true;

    const socket = getChatSocket();

    const handleHistory = ({ conversationId: cid, messages: history }) => {
      if (!isMounted || cid !== conversationId) return;
      const msgs = Array.isArray(history) ? history : (history?.items || []);
      setMessages(msgs);
    };

    const handleNewMessage = (msg) => {
      if (!isMounted || msg.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat_history", handleHistory);
    socket.on("new_message", handleNewMessage);

    // vẫn fetch 1 lần qua REST để đảm bảo history (phòng socket vào sau)
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await messageApi.getMessages(conversationId);
        if (isMounted) {
          const msgs = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
          const mapped = msgs.map((m) => ({
            ...m,
            id: m.id || m._id,
            senderId: m.senderId || m.sender,
            text: m.text || m.content || "",
            imageUrl: m.imageUrl,
          }));
          setMessages(mapped);
        }
      } catch (err) {
        if (isMounted) {
          toast.error(
            err?.message || "Không tải được tin nhắn. Vui lòng thử lại."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();
    socket.emit("join_conversation", { conversationId });

    const handleMessageEdited = (updated) => {
      if (!isMounted || updated.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (String(m.id) === String(updated.id) ? { ...m, ...updated } : m))
      );
    };

    const handleMessageDeleted = (updated) => {
      if (!isMounted || updated.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (String(m.id) === String(updated.id) ? { ...m, isDeleted: true } : m))
      );
    };

    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      isMounted = false;
      socket.off("chat_history", handleHistory);
      socket.off("new_message", handleNewMessage);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [selected]);

  // Typing indicator
  useEffect(() => {
    if (!selected) return;
    const conversationId = String(selected.id);
    const socket = getChatSocket();

    const handleUserTyping = ({ userId, userName }) => {
      if (userId === String(currentUserId)) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
    };
    const handleUserStoppedTyping = ({ userId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    };
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [selected, currentUserId]);

  const emitTypingStart = useCallback(() => {
    if (!selected) return;
    const socket = getChatSocket();
    socket.emit("typing_start", {
      conversationId: String(selected.id),
      userId: currentUserId,
      userName: currentUserName,
    });
  }, [selected, currentUserId, currentUserName]);

  const emitTypingStop = useCallback(() => {
    if (!selected) return;
    const socket = getChatSocket();
    socket.emit("typing_stop", {
      conversationId: String(selected.id),
      userId: currentUserId,
    });
  }, [selected, currentUserId]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTypingStop(), 1500);
  };

  const handleInputBlur = () => {
    emitTypingStop();
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (imageUrlToSend = null) => {
    const text = input.trim();
    const imgUrl = imageUrlToSend ?? pendingImageUrl;
    if ((!text && !imgUrl) || !selected) return;
    const stored =
      JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    if (!stored?.id && !stored?._id) {
      toast.error("Bạn cần đăng nhập để nhắn tin.");
      return;
    }

    const conversationId = String(selected.id);
    const socket = getChatSocket();

    setInput("");
    setPendingImageUrl(null);
    emitTypingStop();

    const previewText = imgUrl ? (text || "Đã gửi ảnh") : text;

    socket.emit(
      "send_message",
      {
        conversationId,
        senderId: currentUserId,
        senderName: currentUserName,
        conversationName: selected.name,
        text: text || "",
        imageUrl: imgUrl || null,
      },
      (res) => {
        if (!res?.ok) {
          toast.error(res?.error || "Không gửi được tin nhắn.");
          if (imgUrl) setPendingImageUrl(imgUrl);
          return;
        }
        const timeStr = formatTime(new Date().toISOString());
        if (onConversationUpdate) {
          onConversationUpdate(conversationId, previewText, timeStr);
        }
      }
    );
  };

  const handleAttachFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast.error("Chỉ hỗ trợ gửi ảnh (jpg, png, gif, webp).");
      e.target.value = "";
      return;
    }
    setUploadingImage(true);
    uploadApi
      .uploadImage(file)
      .then((data) => {
        const url = data?.url;
        if (url) setPendingImageUrl(url);
        else toast.error("Tải ảnh lên thất bại.");
      })
      .catch((err) => {
        toast.error(err?.message || "Tải ảnh lên thất bại.");
      })
      .finally(() => {
        setUploadingImage(false);
        e.target.value = "";
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleEmojiClick = (emoji) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleEditMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditText(msg.text || "");
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editText.trim()) {
      setEditingMessageId(null);
      return;
    }
    const socket = getChatSocket();
    socket.emit(
      "edit_message",
      { messageId: editingMessageId, senderId: currentUserId, text: editText.trim() },
      (res) => {
        if (res?.ok) {
          setEditingMessageId(null);
          setEditText("");
          toast.success("Đã chỉnh sửa tin nhắn.");
        } else {
          toast.error(res?.error || "Không sửa được tin nhắn.");
        }
      }
    );
  };

  const handleDeleteMessage = async (msg) => {
    if (!(await confirm("Thu hồi tin nhắn này?"))) return;
    const socket = getChatSocket();
    socket.emit(
      "delete_message",
      { messageId: msg.id, senderId: currentUserId },
      (res) => {
        if (res?.ok) {
          toast.success("Đã thu hồi tin nhắn.");
        } else {
          toast.error(res?.error || "Không thu hồi được tin nhắn.");
        }
      }
    );
  };

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !e.target.closest("[data-emoji-trigger]")
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateLabel = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Hôm nay";
    if (isYesterday) return "Hôm qua";
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getDateKey = (iso) => {
    if (!iso) return "unknown";
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  const POST_SHARE_PREFIX = "[POST_SHARE]";

  const parsePostShareMeta = (text) => {
    if (!text || !text.startsWith(POST_SHARE_PREFIX)) return null;
    try {
      const jsonPart = text.slice(POST_SHARE_PREFIX.length).trim();
      if (!jsonPart) return null;
      return JSON.parse(jsonPart);
    } catch {
      return null;
    }
  };

  const handleOpenPostPreview = (meta) => {
    if (!meta || !meta.postId) return;
    navigate(`/?postId=${encodeURIComponent(meta.postId)}`);
  };

  const handleSearchMessages = async () => {
    if (!searchQuery.trim() || !selected) return;
    setSearching(true);
    try {
      const conversationId = String(selected.id);
      const data = await messageApi.getMessages(conversationId);
      const allMessages = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const q = searchQuery.toLowerCase();
      const results = allMessages
        .filter((m) => (m.text || m.content || "").toLowerCase().includes(q))
        .map((m, idx) => ({
          ...m,
          id: m.id || m._id || `search-${idx}`,
        }));
      setSearchResults(results);
    } catch {
      toast.error("Không tìm kiếm được tin nhắn.");
    } finally {
      setSearching(false);
    }
  };

  const handleOpenMedia = async () => {
    if (!selected) return;
    setShowMediaModal(true);
    setLoadingMedia(true);
    try {
      const data = await messageApi.getMedia(String(selected.id));
      setMediaList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không tải được media.");
      setMediaList([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleOpenFiles = async () => {
    if (!selected) return;
    setShowFilesModal(true);
    setLoadingFiles(true);
    try {
      const data = await messageApi.getFiles(String(selected.id));
      setFilesList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không tải được file.");
      setFilesList([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const renderMessageBody = (msg) => {
    const meta = parsePostShareMeta(msg.text);
    if (meta) {
      return (
      <div className="space-y-2">
        {meta.imageUrl && (
          <div className="mb-1 overflow-hidden rounded-xl border border-white/60 bg-white/70">
            <img
              src={meta.imageUrl}
              alt=""
              className="w-full max-h-64 object-cover"
            />
          </div>
        )}
        <p className="text-xs text-gray-700">
          {meta.preview ||
            `${msg.senderName || "Một người dùng"} đã chia sẻ một bài viết.`}
        </p>
        <button
          type="button"
          onClick={() => handleOpenPostPreview(meta)}
          className="mt-1 inline-flex w-full items-center justify-center px-3 py-1.5 text-xs rounded-full bg-white/80 text-[#FA8DAE] hover:bg-white"
        >
          Xem bài viết
        </button>
      </div>
    );
    }
    return (
      <div className="space-y-1">
        {msg.imageUrl && (
          <div className="overflow-hidden rounded-xl border border-white/60 bg-white/70 max-w-full">
            <img
              src={msg.imageUrl}
              alt=""
              className="max-w-full max-h-64 object-contain cursor-pointer"
              onClick={() => window.open(msg.imageUrl, "_blank")}
            />
          </div>
        )}
        {msg.text ? (
          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Tin nhắn trống</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-[400px] bg-white md:rounded-2xl md:border md:border-gray-200 md:overflow-hidden">
      {/* Khu vực chat bên trái */}
      {selected ? (
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {/* Header mobile - theo thiết kế mới */}
          <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-100 shrink-0 shadow-sm">
            <div className="flex items-center gap-3 px-3 py-2.5">
              {showBackButton && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition -ml-1"
                  title="Quay lại danh sách"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <div className="w-11 h-11 rounded-full bg-linear-to-br from-[#FED7AA] to-[#FBCFE8] flex items-center justify-center text-sm font-semibold text-[#C2410C] overflow-hidden shrink-0">
                {selected.avatar ? (
                  <img src={selected.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (selected.name?.charAt(0) || "U").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm">
                  {selected.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selected.status === "Online" ? "Đang hoạt động" : "Offline"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowVideoCall(true)}
                  title="Gọi video"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#EA580C] hover:bg-orange-50 transition"
                >
                  <Video className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowInfo((prev) => !prev)}
                  title="Thông tin"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#EA580C] hover:bg-orange-50 transition"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Header desktop */}
          <div className="hidden md:flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-[#FFF7F0] shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#FED7AA] flex items-center justify-center text-sm font-semibold text-[#C2410C] overflow-hidden shrink-0">
              {selected.avatar ? (
                <img src={selected.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (selected.name?.charAt(0) || "U").toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {selected.name}
              </p>
              <p className="text-xs text-gray-500">
                {selected.status === "Online"
                  ? "Đang hoạt động"
                  : selected.lastActive}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {selected.isChatGroup && onLeaveGroup && (
                <button
                  type="button"
                  onClick={async () => {
                    if (await confirm("Rời nhóm chat này?")) onLeaveGroup(selected);
                  }}
                  title="Rời nhóm"
                  className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition text-xs"
                >
                  Rời
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowVideoCall(true)}
                title="Gọi video nhóm"
                className="w-9 h-9 rounded-full bg-white border border-[#FDBA74] flex items-center justify-center text-[#EA580C] hover:bg-[#FFF7ED] transition"
              >
                <Video className="w-4 h-4" />
              </button>
              {onOpenCreateTask && (
                <button
                  type="button"
                  onClick={onOpenCreateTask}
                  title="Giao việc"
                  className="w-9 h-9 rounded-full bg-white border border-[#FB7185] flex items-center justify-center text-[#FB7185] hover:bg-[#FFF1F2] transition"
                >
                  <ClipboardList className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowInfo((prev) => !prev)}
                title="Thông tin cuộc trò chuyện"
                className="w-9 h-9 rounded-full bg-white border border-[#FDBA74] flex items-center justify-center text-[#EA580C] hover:bg-[#FFF7ED] transition"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vùng tin nhắn - mobile responsive */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0 md:p-4 md:space-y-3">
            {loading && (
              <p className="text-xs text-gray-400 text-center">
                Đang tải tin nhắn...
              </p>
            )}
            {!loading && messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </p>
            )}
            {messages.map((msg, index) => {
              const isMe = msg.senderId === String(currentUserId);
              const isLast = index === messages.length - 1;
              const isEditing = editingMessageId === msg.id;
              const isDeleted = msg.isDeleted;
              const safeId = msg.id || `msg-${index}`;

              const showDateLabel = index === 0 ||
                getDateKey(messages[index - 1]?.createdAt) !== getDateKey(msg.createdAt);

              return (
                <React.Fragment key={safeId}>
                  {showDateLabel && (
                    <div className="flex items-center justify-center my-2">
                      <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                        {formatDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    data-msg-id={safeId}
                    ref={isLast ? messagesEndRef : null}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} group`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] md:max-w-[65%] lg:max-w-[55%] rounded-2xl px-3 py-2 md:px-4 md:py-2 relative ${
                        isMe
                          ? "bg-[#F9C96D] text-gray-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[10px] text-gray-500 mb-0.5">
                          {msg.senderName}
                        </p>
                      )}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full text-sm border rounded-lg px-2 py-1 min-h-[60px]"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="text-xs px-2 py-1 bg-[#FA8DAE] text-white rounded"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingMessageId(null); setEditText(""); }}
                              className="text-xs px-2 py-1 bg-gray-300 rounded"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : isDeleted ? (
                        <p className="text-sm text-gray-400 italic">
                          Tin nhắn đã bị thu hồi
                        </p>
                      ) : (
                      <>
                        {renderMessageBody(msg)}
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-[10px] text-gray-500">
                            {formatTime(msg.createdAt)}
                          </p>
                          {msg.editedAt && (
                            <span className="text-[10px] text-gray-400">(đã chỉnh sửa)</span>
                          )}
                        </div>
                      </>
                    )}
                    {isMe && !isDeleted && !isEditing && (
                      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleEditMessage(msg)}
                          title="Sửa"
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg)}
                          title="Thu hồi"
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-red-100 flex items-center justify-center text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </React.Fragment>
              );
            })}
            {Object.keys(typingUsers).length > 0 && (
              <p className="text-xs text-gray-500 italic">
                {Object.values(typingUsers).join(", ")} đang gõ...
              </p>
            )}
          </div>

          {/* Ô nhập tin nhắn - Sticky, responsive mobile */}
          <form
            className="px-3 py-2.5 md:p-4 border-t border-gray-100 bg-white shrink-0 pb-safe"
            style={{ 
              position: 'sticky', 
              bottom: 0,
              paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))'
            }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAttachFile}
            />
            {pendingImageUrl && (
              <div className="mb-2 flex items-start gap-2">
                <div className="relative">
                  <img
                    src={pendingImageUrl}
                    alt="Ảnh đính kèm"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingImageUrl(null)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Ảnh đính kèm (có thể thêm nội dung)</p>
              </div>
            )}
            <div className="relative">
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 max-h-40 overflow-y-auto z-10 w-full max-w-[320px]"
              >
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_LIST.map((emoji, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-gray-100 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5 md:gap-2 rounded-full bg-gray-100 px-3 py-2 md:px-4 md:py-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                title="Gửi ảnh"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#FA8DAE] transition disabled:opacity-50"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <button
                type="button"
                data-emoji-trigger
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                title="Emoji"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#FA8DAE] transition"
              >
                <Smile className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-transparent outline-none text-sm"
                value={input}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
              />
              <button
                type="submit"
                disabled={!input.trim() && !pendingImageUrl}
                className="w-9 h-9 rounded-full bg-[#F9C96D] flex items-center justify-center text-gray-800 hover:bg-[#F7B944] transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Chọn một cuộc trò chuyện để xem tin nhắn
        </div>
      )}

      {showVideoCall && selected && (
        <VideoCallRoom
          roomId={String(selected.id)}
          roomName={selected.name}
          currentUserId={String(currentUserId)}
          currentUserName={currentUserName}
          onClose={() => setShowVideoCall(false)}
        />
      )}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-2">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm md:text-base font-semibold text-gray-800">
                Bài viết được chia sẻ
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="text-gray-500 hover:text-gray-700 text-lg px-2"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <HomePostCard
                post={previewPost}
                onToggleLike={() =>
                  toast.error("Hãy vào trang Bảng tin để thao tác với bài viết.")
                }
                onAddComment={() =>
                  toast.error("Hãy vào trang Bảng tin để bình luận bài viết.")
                }
                onShare={() =>
                  toast.error("Hãy vào trang Bảng tin để chia sẻ bài viết.")
                }
                onDelete={null}
                onEdit={null}
                onOpenComments={() => {}}
                showAllComments
              />
            </div>
          </div>
        </div>
      )}

      {/* Panel thông tin bên phải giống Messenger (sáng, theo theme app) */}
      {showInfo && selected && (
        <aside className="hidden md:flex w-80 border-l border-gray-100 bg-white text-gray-900 flex-col">
          <div className="px-5 py-6 border-b border-gray-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#FED7AA] flex items-center justify-center text-2xl font-semibold text-[#C2410C] mb-3 overflow-hidden">
              {selected.avatar ? (
                <img src={selected.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (selected.name?.charAt(0) || "U").toUpperCase()
              )}
            </div>
            <p className="font-semibold text-sm truncate max-w-full">
              {selected.name}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {selected.isChatGroup ? "Nhóm chat ChatWave" : "Bạn bè trên ChatWave"}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {selected.status === "Online"
                ? "Đang hoạt động"
                : `Hoạt động ${selected.lastActive || "gần đây"}`}
            </p>

            {/* Hàng icon hành động nhanh */}
            <div className="mt-4 flex items-center justify-center gap-4">
              {!selected.isChatGroup && (
                <button
                  type="button"
                  onClick={() => {
                    const uid = selected.userId || selected.partnerId || null;
                    if (uid && !uid.startsWith("direct:") && !uid.startsWith("group:")) {
                      navigate(`/profile/${uid}`);
                    }
                  }}
                  className="flex flex-col items-center gap-1 text-[11px] text-[#EA580C]"
                >
                  <span className="w-9 h-9 rounded-full bg-[#FFEDD5] flex items-center justify-center text-[#EA580C]">
                    <User className="w-4 h-4" />
                  </span>
                  <span className="max-w-[70px] truncate">Trang cá nhân</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setNotificationsMuted((prev) => !prev);
                  toast.success(notificationsMuted ? "Đã bật thông báo." : "Đã tắt thông báo.");
                }}
                className="flex flex-col items-center gap-1 text-[11px] text-[#EA580C]"
              >
                <span className={`w-9 h-9 rounded-full flex items-center justify-center ${notificationsMuted ? "bg-red-50 text-red-500" : "bg-[#FFEDD5] text-[#EA580C]"}`}>
                  {notificationsMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </span>
                <span className="max-w-[70px] truncate">{notificationsMuted ? "Bật thông báo" : "Tắt thông báo"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="flex flex-col items-center gap-1 text-[11px] text-[#EA580C]"
              >
                <span className="w-9 h-9 rounded-full bg-[#FFEDD5] flex items-center justify-center text-[#EA580C]">
                  <Search className="w-4 h-4" />
                </span>
                <span className="max-w-[70px] truncate">Tìm kiếm</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-[13px]">
            {selected.isChatGroup && groupDetails?.members?.length > 0 && (
              <div className="pb-4 border-b border-gray-100">
                <p className="uppercase text-[11px] text-gray-400 mb-2">
                  Thành viên nhóm ({groupDetails.members.length})
                </p>
                <div className="space-y-1">
                  {groupDetails.members.map((m) => {
                    const role =
                      m.userId === groupDetails.ownerId
                        ? "leader"
                        : "member";
                    const myRole =
                      groupDetails.members.find(
                        (x) => x.userId === currentUserId
                      )?.role ||
                      (groupDetails.ownerId === currentUserId ? "leader" : "member");
                    const canTransferOwner = myRole === "leader" && m.userId !== currentUserId;
                    const canKick =
                      myRole === "leader" &&
                      m.userId !== currentUserId &&
                      role !== "leader";

                    return (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#FFF7F0]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {m.displayName}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                              role === "leader"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {role === "leader" && (
                              <Crown className="w-3 h-3" />
                            )}
                            {role === "member" && (
                              <User className="w-3 h-3" />
                            )}
                            {role === "leader" ? "Trưởng nhóm" : "Thành viên"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {canTransferOwner && (
                            <button
                              type="button"
                              title="Chuyển trưởng nhóm"
                              disabled={!!updatingRole}
                              onClick={async () => {
                                if (
                                  !(await confirm(
                                    `Chuyển quyền trưởng nhóm cho ${m.displayName}? Bạn sẽ trở thành thành viên thường.`
                                  ))
                                )
                                  return;
                                setUpdatingRole(m.userId);
                                try {
                                  await chatGroupApi.transferLeadership(
                                    selected.chatGroupId,
                                    m.userId
                                  );
                                  const updated = await chatGroupApi.getById(
                                    selected.chatGroupId
                                  );
                                  setGroupDetails(updated);
                                  toast.success(`Đã chuyển quyền trưởng nhóm cho ${m.displayName}.`);
                                } catch (err) {
                                  toast.error(
                                    err?.response?.data?.message ||
                                      "Không thể chuyển quyền trưởng nhóm."
                                  );
                                } finally {
                                  setUpdatingRole(null);
                                }
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-50 transition"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          )}
                          {canKick && (
                            <button
                              type="button"
                              title="Xóa khỏi nhóm"
                              disabled={!!removingMemberId}
                              onClick={async () => {
                                if (
                                  !(await confirm(
                                    `Xóa ${m.displayName} khỏi nhóm chat?`
                                  ))
                                )
                                  return;
                                setRemovingMemberId(m.userId);
                                try {
                                  await chatGroupApi.removeMember(
                                    selected.chatGroupId,
                                    m.userId
                                  );
                                  const updated =
                                    await chatGroupApi.getById(
                                      selected.chatGroupId
                                    );
                                  setGroupDetails(updated);
                                  toast.success("Đã xóa thành viên khỏi nhóm.");
                                } catch (err) {
                                  toast.error(
                                    err?.response?.data?.message ||
                                      "Không thể xóa thành viên."
                                  );
                                } finally {
                                  setRemovingMemberId(null);
                                }
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FFF7F0]"
              >
                <span>Thông tin về đoạn chat</span>
                <span className="text-xs text-gray-400">›</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FFF7F0]"
              >
                <span>Tùy chỉnh đoạn chat</span>
                <span className="text-xs text-gray-400">›</span>
              </button>
              {groupDetails?.ownerId === currentUserId && (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      !(await confirm(
                        `Giải tán nhóm "${groupDetails.name}"? Tất cả tin nhắn sẽ bị xóa và không thể khôi phục.`
                      ))
                    )
                      return;
                    try {
                      await chatGroupApi.deleteGroup(selected.chatGroupId);
                      toast.success("Đã giải tán nhóm.");
                      setShowInfo(false);
                      if (onLeaveGroup) onLeaveGroup({ ...selected, chatGroupId, _action: "delete" });
                    } catch (err) {
                      toast.error(
                        err?.response?.data?.message || "Không thể giải tán nhóm."
                      );
                    }
                  }}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <span>Giải tán nhóm</span>
                  <span className="text-xs">›</span>
                </button>
              )}
            </div>

            {/* Liên kết và hành động nhanh */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {!selected.isChatGroup && (
                <button
                  type="button"
                  onClick={() => {
                    const uid = selected.userId || selected.partnerId || null;
                    if (uid && !uid.startsWith("direct:") && !uid.startsWith("group:")) {
                      navigate(`/profile/${uid}`);
                    }
                  }}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FFF7F0] text-left"
                >
                  <span>Trang cá nhân</span>
                  <span className="text-xs text-gray-400">↗</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setNotificationsMuted((prev) => !prev);
                  toast.success(notificationsMuted ? "Đã bật thông báo." : "Đã tắt thông báo.");
                }}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FFF7F0]"
              >
                <span>{notificationsMuted ? "Bật thông báo" : "Tắt thông báo đoạn chat"}</span>
                <span className="text-xs text-gray-400">›</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FFF7F0]"
              >
                <span>Tìm kiếm trong đoạn chat</span>
                <span className="text-xs text-gray-400">›</span>
              </button>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="uppercase text-[11px] text-gray-400 mb-1">
                File phương tiện & file
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleOpenMedia}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FFF7F0]"
                >
                  <span>File phương tiện</span>
                  <span className="text-xs text-gray-400">›</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenFiles}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FFF7F0]"
                >
                  <span>File</span>
                  <span className="text-xs text-gray-400">›</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#FFF7F0]"
              >
                <span>Quyền riêng tư và hỗ trợ</span>
                <span className="text-xs text-gray-400">›</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Modal tìm kiếm tin nhắn */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20 px-3">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin nhắn..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-[#FA8DAE]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchMessages();
                  }}
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={handleSearchMessages}
                disabled={searching}
                className="px-4 py-1.5 text-xs rounded-full bg-[#FA8DAE] text-white font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {searching ? "Tìm..." : "Tìm"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-lg px-2"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Không tìm thấy tin nhắn nào.
                </p>
              )}
              {searchResults.length === 0 && !searchQuery && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nhập từ khóa để tìm tin nhắn.
                </p>
              )}
              {searchResults.map((msg, idx) => {
                const safeId = msg.id || `search-${idx}`;
                return (
                <div
                  key={safeId}
                  className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-gray-100"
                  onClick={() => {
                    setShowSearchModal(false);
                    const container = messagesContainerRef.current;
                    const msgEl = container?.querySelector(`[data-msg-id="${msg.id || safeId}"]`);
                    if (msgEl && container) {
                      container.scrollTo({
                        top: msgEl.offsetTop - container.clientHeight / 2,
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#FA8DAE]">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString("vi-VN") : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{msg.text || msg.content}</p>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Media */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Image className="w-5 h-5" />
                File phương tiện
              </h2>
              <button
                type="button"
                onClick={() => { setShowMediaModal(false); setSelectedMedia(null); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loadingMedia ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin w-8 h-8 border-4 border-[#FA8DAE] border-t-transparent rounded-full" />
                </div>
              ) : mediaList.length === 0 ? (
                <div className="text-center py-10">
                  <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400">Chưa có file phương tiện nào.</p>
                </div>
              ) : selectedMedia ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMedia(null)}
                    className="flex items-center gap-2 text-sm text-[#FA8DAE] hover:underline"
                  >
                    ← Quay lại
                  </button>
                  <img
                    src={selectedMedia.url}
                    alt=""
                    className="w-full max-h-[70vh] object-contain rounded-xl bg-gray-50"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{selectedMedia.senderName} • {selectedMedia.createdAt ? new Date(selectedMedia.createdAt).toLocaleString("vi-VN") : ""}</span>
                    <a
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#FA8DAE] hover:underline"
                    >
                      <Download className="w-4 h-4" /> Mở
                    </a>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {mediaList.map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => setSelectedMedia(media)}
                      className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-[#FA8DAE] transition"
                    >
                      <img
                        src={media.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Files */}
      {showFilesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                File
              </h2>
              <button
                type="button"
                onClick={() => setShowFilesModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingFiles ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin w-8 h-8 border-4 border-[#FA8DAE] border-t-transparent rounded-full" />
                </div>
              ) : filesList.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400">Chưa có file nào.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filesList.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#FFF0F5] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-[#FA8DAE]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.fileName}</p>
                        <p className="text-xs text-gray-400">{file.senderName} • {file.createdAt ? new Date(file.createdAt).toLocaleString("vi-VN") : ""}</p>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FFF0F5] text-[#FA8DAE] hover:bg-[#FFE0EB] transition shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
