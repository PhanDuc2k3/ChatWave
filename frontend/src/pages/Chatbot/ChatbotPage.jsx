import React, { useState, useRef, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import { Send, Bot, User } from "lucide-react";
import { chatbotApi } from "../../api/chatbotApi";
import toast from "react-hot-toast";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý AI của ChatWave. Bạn có thể hỏi tôi bất cứ điều gì, tôi sẽ trả lời bằng tiếng Việt.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatbotApi.chat(chatMessages);
      const assistantMessage = {
        role: "assistant",
        content: res.content || "Xin lỗi, tôi không thể trả lời.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast.error(err?.message || "Không thể gửi tin nhắn.");
      setMessages((prev) => prev.filter((m) => m !== userMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="h-full flex flex-col bg-[#F3F6FB]">
        <div className="shrink-0 px-4 py-3 bg-white border-b border-[#E2E8F0]">
          <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#6CB8FF]" />
            Chatbot AI
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Trợ lý AI của ChatWave – Hỏi đáp và hỗ trợ
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-[#FA8DAE] text-white"
                    : "bg-[#6CB8FF] text-white"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-[#FA8DAE] text-white rounded-tr-sm"
                    : "bg-white border border-[#E2E8F0] text-gray-800 rounded-tl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center bg-[#6CB8FF] text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="shrink-0 px-4 py-3 bg-white border-t border-[#E2E8F0]"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 rounded-2xl border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-full bg-[#6CB8FF] text-white flex items-center justify-center hover:bg-[#5AA3E8] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
