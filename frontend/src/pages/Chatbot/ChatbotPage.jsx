import React, { useState, useRef, useEffect, useCallback } from "react";
import MainLayout from "../../layouts/MainLayout";
import { Send, Bot, User, ClipboardList, Plus, MessageSquare, Trash2, ChevronLeft, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { chatbotApi } from "../../api/chatbotApi";
import { chatbotSessionApi } from "../../api/chatbotSessionApi";
import { friendApi } from "../../api/friendApi";
import CreateTasksFromAiModal from "./CreateTasksFromAiModal";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";

const GREETING = {
  role: "assistant",
  content: "Xin chào! Tôi là trợ lý AI của ChatWave. Bạn có thể hỏi tôi bất cứ điều gì, tôi sẽ trả lời bằng tiếng Việt.",
};

export default function ChatbotPage() {
  const { confirm } = useConfirm();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [createTasksLoading, setCreateTasksLoading] = useState(false);
  const [createTasksModal, setCreateTasksModal] = useState(null);
  const [aiAnalyzeResult, setAiAnalyzeResult] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [friendOptions, setFriendOptions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState("list"); // 'list' | 'chat'
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    } catch {
      return null;
    }
  }, []);

  const hasToken = !!localStorage.getItem("chatwave_token");

  const loadSessions = useCallback(async () => {
    if (!hasToken) {
      setSessionsLoading(false);
      return;
    }
    try {
      const data = await chatbotSessionApi.getSessions();
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [hasToken]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!currentUser?.id && !currentUser?._id) return;
    friendApi
      .getFriends(currentUser.id || currentUser._id)
      .then((data) => {
        const mapped = (data || []).map((u) => ({
          id: u.id || u._id || u.userId,
          name: u.username || u.displayName || u.fullName || u.email || "Người dùng",
        }));
        setFriendOptions(mapped);
      })
      .catch(() => setFriendOptions([]));
  }, [currentUser?.id, currentUser?._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = useCallback(async (session) => {
    if (!session) {
      setCurrentSession(null);
      setMessages([GREETING]);
      return;
    }
    setCurrentSession(session);
    const sid = session?.id || session?._id;
    if (!sid) return;
    try {
      const msgs = await chatbotSessionApi.getMessages(sid);
      setMessages(
        (msgs || []).length > 0
          ? msgs.map((m) => ({ role: m.role, content: m.content }))
          : [GREETING]
      );
    } catch {
      setMessages([GREETING]);
    }
  }, []);

  const handleNewChat = async () => {
    if (!hasToken) {
      toast.error("Vui lòng đăng nhập để lưu lịch sử chat.");
      return;
    }
    try {
      const session = await chatbotSessionApi.createSession();
      setSessions((prev) => [session, ...prev]);
      await loadSession(session);
    } catch (err) {
      toast.error(err?.message || "Không tạo được cuộc hội thoại mới.");
    }
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (!(await confirm("Xóa cuộc hội thoại này?"))) return;
    try {
      await chatbotSessionApi.deleteSession(id);
      const getId = (s) => s?.id || s?._id;
      setSessions((prev) => prev.filter((s) => getId(s) !== id));
      if (getId(currentSession) === id) {
        setCurrentSession(null);
        setMessages([GREETING]);
      }
      toast.success("Đã xóa.");
    } catch (err) {
      toast.error(err?.message || "Không xóa được.");
    }
  };

  const handleCreateTasksFromChat = async () => {
    const msgs = messages.filter((m) => m.role === "user" || m.role === "assistant");
    if (msgs.length < 2) {
      toast.error("Cần ít nhất vài tin nhắn trong cuộc hội thoại để AI tạo task.");
      return;
    }
    setCreateTasksLoading(true);
    try {
      const res = await chatbotApi.createTasksFromChat(msgs);
      const tasks = res?.tasks || [];
      if (tasks.length === 0) {
        toast.error("AI không tạo được task. Thử mô tả rõ hơn công việc.");
        return;
      }
      setCreateTasksModal({ tasks });
    } catch (err) {
      toast.error(err?.message || "Không thể tạo task từ AI.");
    } finally {
      setCreateTasksLoading(false);
    }
  };

  const handleApplyAiAnalyze = async (result) => {
    if (!result?.validActions || result.validActions.length === 0) {
      toast.error("Không có action nào để thực thi.");
      return;
    }
    setApplyLoading(true);
    setApplySuccess(false);
    try {
      const teamId = currentUser?.teamId || "default-team";
      await chatbotApi.applyAiActions(result.validActions, teamId);
      setApplySuccess(true);
      toast.success(`✓ Đã thực thi ${result.validActions.length} thay đổi!`);
      setAiAnalyzeResult(null);
    } catch (err) {
      toast.error(`✗ ${err?.message || "Lỗi khi thực thi actions"}`);
    } finally {
      setApplyLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || chatLoading) return;

    let session = currentSession;
    if (hasToken && !session) {
      try {
        session = await chatbotSessionApi.createSession();
        setSessions((prev) => [session, ...prev]);
        setCurrentSession(session);
      } catch (err) {
        toast.error(err?.message || "Không lưu được cuộc hội thoại.");
      }
    }

    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setChatLoading(true);

    try {
      const isFirstUserMessage = messages.filter((m) => m.role === "user").length === 0;
      const sessionId = session?.id || session?._id;
      if (sessionId) {
        await chatbotSessionApi.addMessage(sessionId, "user", text);
        if (isFirstUserMessage) {
          const newTitle = text.slice(0, 50).trim() || "Cuộc hội thoại mới";
          setCurrentSession((prev) => (prev ? { ...prev, id: sessionId, title: newTitle } : prev));
          setSessions((prev) =>
            prev.map((s) =>
              (s?.id || s?._id) === sessionId ? { ...s, id: sessionId, title: newTitle } : s
            )
          );
        }
      }

      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const teamId = currentUser?.teamId || "default-team";
      const res = await chatbotApi.chat(chatMessages, teamId);
      const assistantContent = res.content || "Xin lỗi, tôi không thể trả lời.";
      const assistantMessage = {
        role: "assistant",
        content: assistantContent,
        type: res.type || "chat",
        result: res.result || null,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (res.type === "ai_analyze" && res.result) {
        setAiAnalyzeResult(res.result);
      }

      if (session) {
        await chatbotSessionApi.addMessage(session.id || session._id, "assistant", assistantContent);
      }
    } catch (err) {
      toast.error(`✗ ${err?.message || "Không thể gửi tin nhắn"}`);
      setMessages((prev) => prev.filter((m) => m !== userMessage));
    } finally {
      setChatLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center bg-[#F3F6FB]">
          <p className="text-gray-600">Vui lòng đăng nhập để sử dụng Chatbot AI.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* MOBILE LAYOUT */}
      <div className="h-full flex flex-col bg-[#F3F6FB] md:hidden">
        {mobileView === "list" ? (
          <div className="flex-1 flex flex-col bg-white">
            <div className="shrink-0 p-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Cuộc hội thoại
              </span>
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-medium bg-[#6CB8FF]/10 text-[#6CB8FF] hover:bg-[#6CB8FF]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Mới
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {sessionsLoading ? (
                <p className="text-xs text-gray-500 px-2">Đang tải...</p>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-gray-500 px-2">
                  Chưa có cuộc hội thoại nào. Bắt đầu một cuộc hội thoại mới.
                </p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s?.id || s?._id}
                    role="button"
                    tabIndex={0}
                    onClick={async () => {
                      await loadSession(s);
                      setMobileView("chat");
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        await loadSession(s);
                        setMobileView("chat");
                      }
                    }}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm mb-1 cursor-pointer ${
                      (currentSession?.id || currentSession?._id) ===
                      (s?.id || s?._id)
                        ? "bg-[#6CB8FF]/15 text-[#6CB8FF]"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">
                      {s.title || "Cuộc hội thoại"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleDeleteSession(e, s?.id || s?._id)
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="shrink-0 px-4 py-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="mr-1 w-9 h-9 rounded-full flex items-center justify-center bg-white border border-[#E2E8F0]"
                  title="Quay lại danh sách"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#6CB8FF]" />
                    Chatbot AI
                  </h1>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Trợ lý AI –{" "}
                    {currentSession
                      ? currentSession.title
                      : "Cuộc hội thoại mới"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentSession && (
                  <button
                    type="button"
                    onClick={(e) =>
                      handleDeleteSession(
                        e,
                        currentSession.id || currentSession._id
                      )
                    }
                    className="w-9 h-9 rounded-full flex items-center justify-center border border-red-100 text-red-500 hover:bg-red-50"
                    title="Xóa cuộc hội thoại"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCreateTasksFromChat}
                  disabled={chatLoading || createTasksLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6CB8FF]/10 text-[#6CB8FF] hover:bg-[#6CB8FF]/20 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ClipboardList className="w-4 h-4" />
                  Tạo task
                </button>
              </div>
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
                    <p className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    {msg.type === "ai_analyze" && msg.result && (
                      <button
                        onClick={() => handleApplyAiAnalyze(msg.result)}
                        disabled={applyLoading || !msg.result.validActions?.length || applySuccess}
                        className={`mt-3 flex items-center gap-2 px-3 py-1.5 text-white rounded-lg text-xs font-medium transition ${
                          applySuccess
                            ? "bg-green-500 cursor-default"
                            : "bg-[#FA8DAE] hover:bg-[#e87a9c] disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                      >
                        {applyLoading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Đang thực thi...
                          </>
                        ) : applySuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã áp dụng!
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Apply ({msg.result.validActions?.length || 0})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center bg-[#6CB8FF] text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
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
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 rounded-2xl border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF]"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !input.trim()}
                  className="w-11 h-11 rounded-full bg-[#6CB8FF] text-white flex items-center justify-center hover:bg-[#5AA3E8] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="h-full hidden md:flex bg-[#F3F6FB]">
        {/* Sidebar: Danh sách cuộc hội thoại */}
        <aside
          className={`shrink-0 flex flex-col bg-white border-r border-[#E2E8F0] transition-all ${
            sidebarOpen ? "w-64" : "w-0 overflow-hidden"
          }`}
        >
          <div className="shrink-0 p-3 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Cuộc hội thoại</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-gray-100 lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6CB8FF] hover:bg-[#6CB8FF]/10 mb-2"
            >
              <Plus className="w-4 h-4" />
              Cuộc hội thoại mới
            </button>
            {sessionsLoading ? (
              <p className="text-xs text-gray-500 px-2">Đang tải...</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s?.id || s?._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadSession(s)}
                  onKeyDown={(e) => e.key === "Enter" && loadSession(s)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm mb-1 cursor-pointer ${
                    (currentSession?.id || currentSession?._id) === (s?.id || s?._id) ? "bg-[#6CB8FF]/15 text-[#6CB8FF]" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{s.title || "Cuộc hội thoại"}</span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, s?.id || s?._id)}
                    className="p-1 rounded hover:bg-red-100 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Chat chính */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-2 top-20 z-10 p-2 rounded-lg bg-white border shadow lg:hidden"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          )}

          <div className="shrink-0 px-4 py-3 bg-white border-b border-[#E2E8F0] flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#6CB8FF]" />
                  Chatbot AI
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Trợ lý AI – {currentSession ? currentSession.title : "Cuộc hội thoại mới"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateTasksFromChat}
                disabled={chatLoading || createTasksLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#6CB8FF]/10 text-[#6CB8FF] hover:bg-[#6CB8FF]/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ClipboardList className="w-4 h-4" />
                Tạo task từ cuộc hội thoại
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
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
                  {msg.type === "ai_analyze" && msg.result && (
                    <button
                      onClick={() => handleApplyAiAnalyze(msg.result)}
                      disabled={applyLoading || !msg.result.validActions?.length || applySuccess}
                      className={`mt-3 flex items-center gap-2 px-3 py-1.5 text-white rounded-lg text-xs font-medium transition ${
                        applySuccess
                          ? "bg-green-500 cursor-default"
                          : "bg-[#FA8DAE] hover:bg-[#e87a9c] disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {applyLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang thực thi...
                        </>
                      ) : applySuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã áp dụng!
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Apply ({msg.result.validActions?.length || 0})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
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
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-2xl border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF]"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !input.trim()}
                className="w-11 h-11 rounded-full bg-[#6CB8FF] text-white flex items-center justify-center hover:bg-[#5AA3E8] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {createTasksModal && (
          <CreateTasksFromAiModal
            tasks={createTasksModal.tasks}
            assignerId={currentUser?.id || currentUser?._id}
            assignerName={
              currentUser?.username ||
              currentUser?.displayName ||
              currentUser?.email ||
              "Bạn"
            }
            friendOptions={friendOptions}
            onClose={() => setCreateTasksModal(null)}
            onSuccess={() => setCreateTasksModal(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
