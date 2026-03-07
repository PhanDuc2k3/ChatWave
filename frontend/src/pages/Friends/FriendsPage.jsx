import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Gift, List, Search } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { friendApi } from "../../api/friendApi";
import { userApi } from "../../api/userApi";
import toast from "react-hot-toast";

export default function FriendsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    const currentUserId = storedUser?.id || storedUser?._id || null;
    if (!currentUserId) return;

    const load = async () => {
      try {
        const reqData = await friendApi.getRequests(currentUserId);
        setRequests(reqData.incoming || []);
        const sugData = await friendApi.getSuggestions(currentUserId);
        setSuggestions(sugData || []);
      } catch (err) {
        toast.error(err?.message || "Không tải được dữ liệu bạn bè.");
      }
    };

    load();
  }, []);

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
                  const storedUser =
                    JSON.parse(
                      localStorage.getItem("chatwave_user") || "null"
                    ) || null;
                  const currentUserId =
                    storedUser?.id || storedUser?._id || null;
                  await friendApi.respondRequest(
                    req.id,
                    currentUserId,
                    "accept"
                  );
                  setRequests((prev) =>
                    prev.filter((r) => r.id !== req.id)
                  );
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
                  const storedUser =
                    JSON.parse(
                      localStorage.getItem("chatwave_user") || "null"
                    ) || null;
                  const currentUserId =
                    storedUser?.id || storedUser?._id || null;
                  await friendApi.respondRequest(
                    req.id,
                    currentUserId,
                    "decline"
                  );
                  setRequests((prev) =>
                    prev.filter((r) => r.id !== req.id)
                  );
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

        {/* Main content: grid of friend requests + suggestions */}
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {requests.map((req) => renderRequestCard(req))}
            {requests.length === 0 && (
              <p className="text-[11px] md:text-xs text-gray-500 col-span-2 md:col-span-3 lg:col-span-4">
                Hiện chưa có lời mời kết bạn nào.
              </p>
            )}
          </div>

          <div className="mt-4">
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
                              const storedUser =
                                JSON.parse(
                                  localStorage.getItem("chatwave_user") ||
                                    "null"
                                ) || null;
                              const currentUserId =
                                storedUser?.id || storedUser?._id || null;
                              if (!currentUserId) {
                                toast.error(
                                  "Bạn cần đăng nhập để gửi lời mời kết bạn."
                                );
                                return;
                              }
                              await friendApi.sendRequest(
                                sug.id,
                                currentUserId
                              );
                              toast.success("Đã gửi lời mời kết bạn.");
                              setSuggestions((prev) =>
                                prev.filter((x) => x.id !== sug.id)
                              );
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
                  Tạm thời không có gợi ý nào. Hãy kết bạn thêm để có nhiều gợi
                  ý hơn.
                </p>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm md:text-base font-semibold text-gray-800">
                    Tìm kiếm người dùng
                  </h3>
                  <p className="text-[11px] md:text-xs text-gray-500">
                    Tìm theo tên hoặc email
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex items-center bg-white rounded-full border border-gray-300 px-3 py-1.5">
                  <Search className="w-4 h-4 text-gray-400 mr-1" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Nhập tên hoặc email người dùng..."
                    className="flex-1 bg-transparent outline-none text-xs md:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const q = searchText.trim();
                    if (!q) {
                      setSearchResults([]);
                      return;
                    }
                    try {
                      const res = await userApi.search(q);
                      setSearchResults(res || []);
                    } catch (err) {
                      toast.error(
                        err?.message ||
                          "Không tìm được người dùng phù hợp."
                      );
                    }
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#FA8DAE] text-white text-xs md:text-sm font-semibold hover:opacity-90 transition"
                >
                  Tìm
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {searchResults.map((user) => {
                    const name = user.username || user.email || "User";
                    const initial = name.charAt(0);
                    return (
                      <div
                        key={user.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                      >
                        <div className="h-24 md:h-28 bg-[#FFF7F0] flex items-center justify-center text-2xl font-semibold text-[#FA8DAE]">
                          {initial}
                        </div>
                        <div className="p-3 md:p-4 flex-1 flex flex-col gap-2">
                          <p className="text-sm md:text-base font-semibold text-gray-900">
                            {name}
                          </p>
                          <p className="text-[11px] md:text-xs text-gray-500 break-all">
                            {user.email}
                          </p>
                          <div className="mt-auto flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/profile/${user.id}`)}
                              className="w-full rounded-full bg-gray-100 text-gray-800 text-xs md:text-sm font-semibold py-1.5 hover:bg-gray-200 transition"
                            >
                              Xem trang cá nhân
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const storedUser =
                                    JSON.parse(
                                      localStorage.getItem(
                                        "chatwave_user"
                                      ) || "null"
                                    ) || null;
                                  const currentUserId =
                                    storedUser?.id || storedUser?._id || null;
                                  if (!currentUserId) {
                                    toast.error(
                                      "Bạn cần đăng nhập để gửi lời mời kết bạn."
                                    );
                                    return;
                                  }
                                  await friendApi.sendRequest(
                                    user.id,
                                    currentUserId
                                  );
                                  toast.success(
                                    "Đã gửi lời mời kết bạn."
                                  );
                                } catch (err) {
                                  toast.error(
                                    err?.message ||
                                      "Không gửi được lời mời kết bạn."
                                  );
                                }
                              }}
                              className="w-full rounded-full bg-[#F9C96D] text-gray-800 text-xs md:text-sm font-semibold py-1.5 hover:bg-[#F7B944] transition"
                            >
                              Kết bạn
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
