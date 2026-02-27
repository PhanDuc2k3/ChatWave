import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { initialFriends } from "./friendsData";

export default function FriendsAllPage() {
  const navigate = useNavigate();
  const [friends] = useState(initialFriends);
  const [selectedFriendId, setSelectedFriendId] = useState(
    initialFriends[0]?.id ?? null
  );

  const selectedFriend =
    friends.find((f) => f.id === selectedFriendId) || friends[0] || null;

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
        Tất cả bạn bè
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
          onClick={() => navigate("/friends/all")}
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
        {/* Left column: friends list */}
        <aside className="w-full md:w-1/3 bg-white text-gray-900 rounded-2xl border border-gray-200 p-3 md:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-base font-semibold">
                Tất cả bạn bè
              </h3>
              <p className="text-[11px] md:text-xs text-gray-500">
                {friends.length} bạn bè
              </p>
            </div>
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto space-y-1 pr-1">
            {friends.map((friend) => {
              const initial =
                friend.name.split(" ").slice(-1)[0]?.[0] || friend.name[0];
              const isActive =
                selectedFriend && selectedFriend.id === friend.id;
              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => setSelectedFriendId(friend.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left ${
                    isActive ? "bg-[#FFF7F0]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#FFE6DD] flex items-center justify-center text-xs font-semibold text-[#F58A4A]">
                      {initial}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold truncate">
                      {friend.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {friend.status === "Online"
                        ? "Đang hoạt động"
                        : friend.lastActive}
                    </p>
                  </div>
                </button>
              );
            })}

            {friends.length === 0 && (
              <p className="text-[11px] text-gray-500 mt-2">
                Bạn chưa có bạn bè nào.
              </p>
            )}
          </div>
        </aside>

        {/* Right column: selected friend + friends & posts */}
        <section className="flex-1 space-y-4">
          {selectedFriend ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 space-y-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#FFE6DD] flex items-center justify-center text-lg md:text-xl font-semibold text-[#F58A4A]">
                      {selectedFriend.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="text-base md:text-xl font-semibold text-gray-900">
                      {selectedFriend.name}
                    </p>
                    <p className="text-[11px] md:text-xs text-gray-500">
                      {selectedFriend.status === "Online"
                        ? "Đang hoạt động"
                        : `Hoạt động gần đây: ${selectedFriend.lastActive}`}
                    </p>
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
              Bạn chưa có bạn bè nào. Hãy kết nối thêm nhé!
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
