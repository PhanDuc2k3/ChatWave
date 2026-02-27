import React, { useRef } from "react";
import { Send } from "lucide-react";

export default function MessageContent({ selected }) {
  const messagesEndRef = useRef(null);

  // Mock tin nhắn mẫu
  const mockMessages = selected
    ? [
        { id: 1, from: selected.id, text: selected.message, time: "10:30" },
        {
          id: 2,
          from: "me",
          text: "Chào bạn!",
          time: "10:32",
        },
        {
          id: 3,
          from: selected.id,
          text: "Xin chào, bạn khoẻ không?",
          time: "10:33",
        },
      ]
    : [];

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
            {mockMessages.map((msg) => (
              <div
                key={msg.id}
                ref={msg.id === mockMessages.length ? messagesEndRef : null}
                className={`flex ${
                  msg.from === "me" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.from === "me"
                      ? "bg-[#F9C96D] text-gray-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-[#F9C96D] flex items-center justify-center text-gray-800 hover:bg-[#F7B944] transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Chọn một cuộc trò chuyện để xem tin nhắn
        </div>
      )}
    </div>
  );
}
