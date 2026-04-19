import React, { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Gift, List, ChevronLeft, ChevronRight } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { friendApi } from "../../api/friendApi";
import { useFriends } from "../../hooks/useFriends";
import toast from "react-hot-toast";

function SuggestionCard({ user, onAdd, onProfile }) {
  const initial = (user.username || user.email || "U")[0].toUpperCase();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col w-44 shrink-0">
      <div
        onClick={onProfile}
        className="h-32 bg-gradient-to-br from-[#FFB3C6] to-[#FA8DAE] flex items-center justify-center cursor-pointer hover:opacity-90 transition overflow-hidden"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-semibold text-white">{initial}</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-gray-900 truncate text-center">{user.username || user.email}</p>
        {user.mutualCount > 0 && (
          <p className="text-[11px] text-gray-500 text-center">{user.mutualCount} bạn chung</p>
        )}
        <div className="mt-auto flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onAdd}
            className="w-full rounded-full bg-[#FA8DAE] text-white text-xs font-semibold py-1.5 hover:bg-[#e87a9c] transition"
          >
            Thêm bạn bè
          </button>
          <button
            type="button"
            onClick={onProfile}
            className="w-full rounded-full bg-gray-100 text-gray-700 text-xs font-semibold py-1.5 hover:bg-gray-200 transition"
          >
            Xem trang cá nhân
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ req, onAccept, onDecline, onProfile }) {
  const initial = (req.otherUserName || "U")[0].toUpperCase();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col w-44 shrink-0">
      <div
        onClick={onProfile}
        className="h-32 bg-gradient-to-br from-[#FFE6DD] to-[#FFB088] flex items-center justify-center cursor-pointer hover:opacity-90 transition overflow-hidden"
      >
        {req.avatar ? (
          <img src={req.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-semibold text-white">{initial}</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-gray-900 truncate text-center">{req.otherUserName}</p>
        <p className="text-[11px] text-gray-500 text-center">Lời mời kết bạn</p>
        <div className="mt-auto flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onAccept}
            className="w-full rounded-full bg-[#F9C96D] text-gray-800 text-xs font-semibold py-1.5 hover:bg-[#F7B944] transition"
          >
            Xác nhận
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="w-full rounded-full bg-gray-100 text-gray-700 text-xs font-semibold py-1.5 hover:bg-gray-200 transition"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const suggestionsRef = useRef(null);
  const requestsRef = useRef(null);
  const handleFetchError = useCallback((err) => {
    toast.error(err?.message || "Không tải được dữ liệu bạn bè.");
  }, []);

  const {
    requests,
    suggestions,
    setRequests,
    removeRequest,
    removeSuggestion,
    currentUserId,
  } = useFriends({ onError: handleFetchError });

  const scrollLeft = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: 320, behavior: "smooth" });
  };

  const displayedRequests = requests.slice(0, 10);
  const displayedSuggestions = suggestions.slice(0, 10);

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-sm md:text-base font-semibold text-gray-800">
        Bạn bè
      </h2>
      <span className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
        <Users className="w-4 h-4" />
        Trang chủ
      </span>
    </div>
  );

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full h-full bg-[#F3F6FB] flex flex-col md:flex-row gap-4 px-3 md:px-6 py-4">
        {/* Friends section sidebar (desktop) */}
        <aside className="hidden md:flex w-56 flex-col bg-white rounded-2xl border border-gray-200 py-3 shadow-sm">
          <h3 className="px-4 mb-2 text-sm font-semibold text-gray-800">
            Bạn bè
          </h3>
          <nav className="flex-1 flex flex-col gap-1 text-sm">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-[#FA8DAE] bg-[#FFF7F0]"
            >
              <Users className="w-4 h-4" />
              <span>Trang chủ</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/friends/requests")}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Lời mời kết bạn</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/friends/all")}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              <span>Tất cả bạn bè</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-gray-400 cursor-not-allowed"
            >
              <Gift className="w-4 h-4" />
              <span>Sinh nhật</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-gray-400 cursor-not-allowed"
            >
              <List className="w-4 h-4" />
              <span>Danh sách tuỳ chỉnh</span>
            </button>
          </nav>
        </aside>

        {/* Tabs cho mobile */}
        <div className="md:hidden w-full bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between gap-1 text-xs">
            <button
              type="button"
              className="flex-1 px-2 py-1.5 rounded-full bg-[#FFF7F0] text-[#FA8DAE] font-semibold"
            >
              Trang chủ
            </button>
            <button
              type="button"
              onClick={() => navigate("/friends/requests")}
              className="flex-1 px-2 py-1.5 rounded-full text-gray-600 hover:bg-gray-50"
            >
              Lời mời
            </button>
            <button
              type="button"
              onClick={() => navigate("/friends/all")}
              className="flex-1 px-2 py-1.5 rounded-full text-gray-600 hover:bg-gray-50"
            >
              Tất cả bạn bè
            </button>
          </div>
        </div>

        {/* Main content: giống layout task: khối trắng có padding */}
        <section className="flex-1 min-w-0 flex flex-col">
          <div className="h-full bg-[#F3F6FB] rounded-2xl border border-gray-200 px-4 py-3 flex flex-col gap-4">

          {/* Lời mời kết bạn - 50% trên */}
          <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-800">
                Lời mời kết bạn
              </h3>
              <p className="text-[11px] md:text-xs text-gray-500">
                {requests.length} lời mời kết bạn
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/friends/requests")}
              className="text-xs md:text-sm text-[#FA8DAE] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="relative group/suggest">
            <button
              type="button"
              onClick={() => scrollLeft(requestsRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 opacity-0 group-hover/suggest:opacity-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={requestsRef}
              className="flex gap-3 overflow-x-auto px-2 pb-1 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {displayedRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  onAccept={async () => {
                    try {
                      await friendApi.respondRequest(req.id, currentUserId, "accept");
                      removeRequest(req.id);
                      toast.success("Đã chấp nhận lời mời kết bạn.");
                    } catch (err) {
                      toast.error(err?.message || "Không xác nhận được lời mời.");
                    }
                  }}
                  onDecline={async () => {
                    try {
                      await friendApi.respondRequest(req.id, currentUserId, "decline");
                      removeRequest(req.id);
                      toast.success("Đã xoá lời mời.");
                    } catch (err) {
                      toast.error(err?.message || "Không xoá được lời mời.");
                    }
                  }}
                  onProfile={() => navigate(`/profile/${req.otherUserId}`)}
                />
              ))}
              {displayedRequests.length === 0 && (
                <p className="text-[11px] md:text-xs text-gray-500 py-4 px-2">
                  Hiện tại bạn không có lời mời kết bạn nào cần xử lý.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => scrollRight(requestsRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 opacity-0 group-hover/suggest:opacity-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          </div>

          {/* Gợi ý kết bạn - 50% dưới */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm md:text-base font-semibold text-gray-800">
                  Gợi ý kết bạn
                </h3>
                <p className="text-[11px] md:text-xs text-gray-500">
                  Dựa trên những người chưa kết nối với bạn
                </p>
              </div>
            </div>

            <div className="relative group/suggest2">
              <button
                type="button"
                onClick={() => scrollLeft(suggestionsRef)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 opacity-0 group-hover/suggest2:opacity-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div
                ref={suggestionsRef}
                className="flex gap-3 overflow-x-auto px-2 pb-1 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {displayedSuggestions.map((sug) => (
                  <SuggestionCard
                    key={sug.id}
                    user={sug}
                    onAdd={async () => {
                      try {
                        if (!currentUserId) {
                          toast.error("Bạn cần đăng nhập để gửi lời mời kết bạn.");
                          return;
                        }
                        await friendApi.sendRequest(sug.id, currentUserId);
                        toast.success("Đã gửi lời mời kết bạn.");
                        removeSuggestion(sug.id);
                      } catch (err) {
                        toast.error(err?.message || "Không gửi được lời mời kết bạn.");
                      }
                    }}
                    onProfile={() => navigate(`/profile/${sug.id}`)}
                  />
                ))}
                {displayedSuggestions.length === 0 && (
                  <p className="text-[11px] md:text-xs text-gray-500 py-4 px-2">
                    Tạm thời không có gợi ý nào. Hãy kết bạn thêm để có nhiều gợi ý hơn.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => scrollRight(suggestionsRef)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 opacity-0 group-hover/suggest2:opacity-100 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
