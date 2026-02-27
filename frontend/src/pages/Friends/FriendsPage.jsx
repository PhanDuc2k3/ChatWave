import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Gift, List } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { initialFriendRequests } from "./friendsData";

export default function FriendsPage() {
  const navigate = useNavigate();
  const requests = initialFriendRequests;

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
    const initial = req.name.charAt(0);
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
            {req.name}
          </p>
          <p className="text-[11px] md:text-xs text-gray-500">
            {req.note} · {req.mutualCount} bạn chung
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              className="w-full rounded-full bg-[#F9C96D] text-gray-800 text-xs md:text-sm font-semibold py-1.5 hover:bg-[#F7B944] transition"
            >
              Xác nhận
            </button>
            <button
              type="button"
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
      <div className="w-full flex gap-4">
        {/* Friends section sidebar */}
        <aside className="hidden md:flex w-56 flex-col bg-white rounded-2xl border border-gray-200 py-3">
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

        {/* Main content: grid of friend requests */}
        <section className="flex-1">
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {requests.map((req) => renderRequestCard(req))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
