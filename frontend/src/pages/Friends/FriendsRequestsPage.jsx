import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { initialFriends, initialFriendRequests } from "./friendsData";

export default function FriendsRequestsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState(initialFriends);
  const [requests, setRequests] = useState(initialFriendRequests);
  const [selectedRequestId, setSelectedRequestId] = useState(
    initialFriendRequests[0]?.id ?? null
  );

  const filteredRequests = useMemo(() => {
    return requests;
  }, [requests]);

  const selectedRequest =
    filteredRequests.find((r) => r.id === selectedRequestId) ||
    filteredRequests[0] ||
    null;

  const handleAcceptRequest = (id) => {
    setRequests((prev) => {
      const req = prev.find((r) => r.id === id);
      const next = prev.filter((r) => r.id !== id);
      if (req) {
        setFriends((currentFriends) => [
          {
            id: Date.now(),
            name: req.name,
            message: "Xin chào",
            status: "Online",
            lastActive: "05/2/2026",
          },
          ...currentFriends,
        ]);
      }
      if (!next.find((r) => r.id === selectedRequestId)) {
        setSelectedRequestId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleDeclineRequest = (id) => {
    setRequests((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (!next.find((r) => r.id === selectedRequestId)) {
        setSelectedRequestId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const headerContent = (
    <div className="flex items-center gap-2 w-full">
      <button
        type="button"
        onClick={() => navigate("/friends")}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        aria-label="Quay lại"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-sm md:text-base font-semibold text-gray-800">
        Lời mời kết bạn
      </h2>
    </div>
  );

  const renderFriendsPreview = () => (
    <div className="mt-4 bg-white rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm md:text-base font-semibold text-gray-800">
          Bạn bè
        </h3>
        <button
          type="button"
          className="text-xs md:text-sm text-[#FA8DAE] hover:underline"
        >
          Xem tất cả bạn bè
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {friends.slice(0, 6).map((friend) => {
          const lastName =
            friend.name.split(" ").slice(-1)[0] || friend.name[0];
          const initial = lastName[0];
          return (
            <div
              key={friend.id}
              className="flex flex-col items-center text-center gap-1"
            >
              <div className="w-14 h-14 rounded-xl bg-[#FFE6DD] flex items-center justify-center text-sm font-semibold text-[#F58A4A] overflow-hidden">
                {initial}
              </div>
              <p className="text-[11px] md:text-xs text-gray-700 line-clamp-2">
                {friend.name}
              </p>
            </div>
          );
        })}
        {friends.length === 0 && (
          <p className="text-xs md:text-sm text-gray-500 col-span-3">
            Bạn chưa có bạn bè nào. Hãy kết nối thêm nhé!
          </p>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout
      headerContent={headerContent}
      showSearch={false}
      showHeaderActions={false}
    >
      <div className="w-full flex flex-col md:flex-row gap-4">
        {/* Left column: friend requests list */}
        <aside className="w-full md:w-1/3 bg-white text-gray-900 rounded-2xl border border-gray-200 p-3 md:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-base font-semibold">
                Lời mời kết bạn
              </h3>
              <p className="text-[11px] md:text-xs text-gray-500">
                {requests.length} lời mời kết bạn
              </p>
            </div>
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto space-y-1 pr-1">
            {filteredRequests.map((req) => {
              const initial = req.name.charAt(0);
              const isActive = selectedRequest && selectedRequest.id === req.id;
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left ${
                    isActive ? "bg-[#FFF7F0]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#FFE6DD] flex items-center justify-center text-xs font-semibold text-[#F58A4A]">
                      {initial}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-semibold">
                      {req.name}
                    </p>
                    <p className="text-[10px] text-gray-400">{req.timeAgo}</p>
                  </div>
                  <div className="flex flex-col gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptRequest(req.id);
                      }}
                      className="rounded-full bg-[#F9C96D] px-2 py-0.5 text-xs text-gray-800 hover:bg-[#F7B944] transition"
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeclineRequest(req.id);
                      }}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </button>
              );
            })}

            {filteredRequests.length === 0 && (
              <p className="text-[11px] text-gray-500 mt-2">
                Không có lời mời nào phù hợp.
              </p>
            )}
          </div>
        </aside>

        {/* Right column: selected friend + friends & posts */}
        <section className="flex-1 space-y-4">
          {selectedRequest ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#FFE6DD] flex items-center justify-center text-lg md:text-xl font-semibold text-[#F58A4A]">
                        {selectedRequest.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="text-base md:text-xl font-semibold text-gray-900">
                        {selectedRequest.name}
                      </p>
                      <p className="text-[11px] md:text-xs text-gray-500">
                        Đã gửi cho bạn lời mời kết bạn
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(selectedRequest.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-[#F9C96D] text-gray-800 text-xs md:text-sm px-4 py-1.5 hover:bg-[#F7B944] transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Xác nhận lời mời</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(selectedRequest.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-gray-100 text-gray-800 text-xs md:text-sm px-4 py-1.5 hover:bg-gray-200 transition"
                    >
                      <X className="w-4 h-4" />
                      <span>Xóa lời mời</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4">
                <div className="flex items-center gap-4 text-xs md:text-sm font-medium">
                  <button className="pb-1 text-[#FA8DAE] relative">
                    Tất cả
                    <span className="absolute left-0 -bottom-0.5 w-full h-[2px] bg-[#FA8DAE]" />
                  </button>
                  <button className="pb-1 text-gray-500 hidden md:inline">
                    Giới thiệu
                  </button>
                  <button className="pb-1 text-gray-500 hidden md:inline">
                    Bạn bè
                  </button>
                  <button className="pb-1 text-gray-500 hidden md:inline">
                    Ảnh
                  </button>
                  <button className="pb-1 text-gray-500 hidden md:inline">
                    Bài viết
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-[30%]">{renderFriendsPreview()}</div>

                <div className="w-full lg:w-[70%] bg-white rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm md:text-base font-semibold text-gray-800">
                      Bài viết
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">
                    Không có bài viết.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm px-4 py-6 md:px-6 md:py-8 text-center text-sm md:text-base text-gray-600">
              Bạn chưa có lời mời kết bạn nào. Khi có lời mời mới, bạn có thể
              xem chi tiết tại đây.
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

