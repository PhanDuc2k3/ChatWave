import React, { useState, useMemo } from "react";
import { Search, X, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { userApi, chatApi } from "../../api/userApi";

export default function UserSearchModal({ onClose, onSelectConversation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const currentUserId = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("chatwave_user") || "null");
      return u?.id ?? u?._id ?? null;
    } catch {
      return null;
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || q.length < 2) {
      if (q.length > 0 && q.length < 2) {
        toast.error("Nhập ít nhất 2 ký tự để tìm kiếm");
      }
      return;
    }

    setLoading(true);
    try {
      setSearching(true);
      const data = await userApi.search(q);
      // Filter out current user
      const filtered = (data || []).filter(
        (u) => String(u.id || u._id) !== String(currentUserId)
      );
      setResults(filtered);
    } catch (err) {
      toast.error(err?.message || "Không tìm được người dùng");
      setResults([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSelectUser = async (user) => {
    const userId = user.id || user._id;
    if (!userId) return;

    try {
      // Get or create conversation
      const conversation = await chatApi.getOrCreateConversation(userId);
      
      // Build conversation object similar to existing conversations
      const convData = {
        ...conversation,
        id: conversation.id || conversation._id,
        name: user.username || user.email || user.name || "User",
        avatar: user.avatar || null,
      };

      onSelectConversation(convData);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Không thể mở cuộc trò chuyện");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-3">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            Tin nhắn mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm người dùng..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="mt-3 w-full py-2.5 bg-[#FA8DAE] text-white rounded-xl text-sm font-medium hover:bg-[#E87A9B] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searching && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#FA8DAE] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Không tìm thấy người dùng nào</p>
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="space-y-2">
              {results.map((user) => {
                const userId = user.id || user._id;
                const name = user.username || user.email || user.name || "User";
                const initial = name.trim().charAt(0).toUpperCase();

                return (
                  <button
                    key={userId}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#FA8DAE] to-[#FFB3C6] flex items-center justify-center text-white font-semibold shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{name}</p>
                      {user.email && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>
                    <MessageCircle className="w-5 h-5 text-[#FA8DAE] shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {!searching && query.trim().length < 2 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">
                Nhập ít nhất 2 ký tự để tìm kiếm người dùng
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
