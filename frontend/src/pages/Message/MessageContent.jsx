import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { getChatSocket } from "../../socket/chatSocket";
import { messageApi } from "../../api/messageApi";

export default function MessageContent({ selected, onConversationUpdate }) {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const storedUser =
    JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  const currentUserId = storedUser?.id || storedUser?._id || "me";
  const currentUserName =
    storedUser?.username || storedUser?.email || storedUser?.name || "Bạn";

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
      setMessages(history || []);
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
          setMessages(data || []);
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

    return () => {
      isMounted = false;
      socket.off("chat_history", handleHistory);
      socket.off("new_message", handleNewMessage);
    };
  }, [selected]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selected) return;

    const conversationId = String(selected.id);
    const socket = getChatSocket();

    socket.emit(
      "send_message",
      {
        conversationId,
        senderId: currentUserId,
        senderName: currentUserName,
        conversationName: selected.name,
        text,
      },
      (res) => {
        if (!res?.ok) {
          toast.error(res?.error || "Không gửi được tin nhắn.");
          return;
        }

        const timeStr = formatTime(new Date().toISOString());
        if (onConversationUpdate) {
          onConversationUpdate(conversationId, text, timeStr);
        }
        setInput("");
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header cuộc trò chuyện */}
      {selected ? (
        <>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#FFE6DD] flex items-center justify-center text-sm font-semibold text-[#F58A4A]">
              {selected.name.charAt(0)}
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
          </div>

          {/* Vùng tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <p className="text-xs text-gray-400 text-center">
                Đang tải tin nhắn...
              </p>
            )}
            {messages.map((msg, index) => {
              const isMe = msg.senderId === String(currentUserId);
              const isLast = index === messages.length - 1;

              return (
                <div
                  key={msg.id}
                  ref={isLast ? messagesEndRef : null}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
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
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ô nhập tin nhắn */}
          <form
            className="p-4 border-t border-gray-100"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-transparent outline-none text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-full bg-[#F9C96D] flex items-center justify-center text-gray-800 hover:bg-[#F7B944] transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Chọn một cuộc trò chuyện để xem tin nhắn
        </div>
      )}
    </div>
  );
}
