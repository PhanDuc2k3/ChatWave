import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Gift, List } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { friendApi } from "../../api/friendApi";
import { useFriends } from "../../hooks/useFriends";
import toast from "react-hot-toast";

export default function FriendsPage() {
  const navigate = useNavigate();
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

  const renderRequestCard = (req) => {
    const initial = req.otherUserName.charAt(0);
    return (
      <div
        key={req.id}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
      >
        <div className="h-32 md:h-40 bg-[#FFE6DD] flex items-center justify-center text-3xl font-semibold text-[#F58A4A]">
          {initial}
        </div>
        <div className="p-3 md:p-4 flex-1 flex flex-col gap-2">
          <p className="text-sm md:text-base font-semibold text-gray-900">
            {req.otherUserName}
          </p>
          <p className="text-[11px] md:text-xs text-gray-500">
            Lời mời kết bạn tới bạn
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await friendApi.respondRequest(req.id, currentUserId, "accept");
                  removeRequest(req.id);
                  toast.success("Đã chấp nhận lời mời kết bạn.");
                } catch (err) {
                  toast.error(err?.message || "Không xác nhận được lời mời.");
                }
              }}
              className="w-full rounded-full bg-[#F9C96D] text-gray-800 text-xs md:text-sm font-semibold py-1.5 hover:bg-[#F7B944] transition"
            >
              Xác nhận
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await friendApi.respondRequest(req.id, currentUserId, "decline");
                  removeRequest(req.id);
                  toast.success("Đã xoá lời mời.");
                } catch (err) {
                  toast.error(err?.message || "Không xoá được lời mời.");
                }
              }}
              className="w-full rounded-full bg-gray-100 text-gray-800 text-xs md:text-sm font-semibold py-1.5 hover:bg-gray-200 transition"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    );
  };

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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-1">
            {requests.map((req) => renderRequestCard(req))}
            {requests.length === 0 && (
              <p className="text-[11px] md:text-xs text-gray-500 col-span-2 md:col-span-3 lg:col-span-4">
                Hiện tại bạn không có lời mời kết bạn nào cần xử lý.
              </p>
            )}
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-1">
              {suggestions.map((sug) => {
                const initial =
                  sug.username?.charAt(0) ||
                  sug.email?.charAt(0) ||
                  "U";
                return (
                  <div
                    key={sug.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                  >
                    <div className="h-28 md:h-32 bg-[#E7F3FF] flex items-center justify-center text-3xl font-semibold text-[#6CB8FF]">
                      {initial}
                    </div>
                    <div className="p-3 md:p-4 flex-1 flex flex-col gap-2">
                      <p className="text-sm md:text-base font-semibold text-gray-900">
                        {sug.username || sug.email}
                      </p>
                      {sug.mutualCount > 0 && (
                        <p className="text-[11px] md:text-xs text-gray-500">
                          {sug.mutualCount} bạn chung
                        </p>
                      )}
                      <div className="mt-auto flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (!currentUserId) {
                                toast.error(
                                  "Bạn cần đăng nhập để gửi lời mời kết bạn."
                                );
                                return;
                              }
                              await friendApi.sendRequest(sug.id, currentUserId);
                              toast.success("Đã gửi lời mời kết bạn.");
                              removeSuggestion(sug.id);
                            } catch (err) {
                              toast.error(
                                err?.message ||
                                  "Không gửi được lời mời kết bạn."
                              );
                            }
                          }}
                          className="w-full rounded-full bg-[#F9C96D] text-gray-800 text-xs md:text-sm font-semibold py-1.5 hover:bg-[#F7B944] transition"
                        >
                          Thêm bạn bè
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {suggestions.length === 0 && (
                <p className="text-[11px] md:text-xs text-gray-500 col-span-2 md:col-span-3 lg:col-span-4">
                  Tạm thời không có gợi ý nào. Hãy kết bạn thêm để có nhiều gợi ý hơn.
                </p>
              )}
            </div>
          </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
