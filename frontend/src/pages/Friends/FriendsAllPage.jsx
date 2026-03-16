import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { friendApi } from "../../api/friendApi";
import { postApi } from "../../api/postApi";
import toast from "react-hot-toast";

export default function FriendsAllPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [selectedFriendFriends, setSelectedFriendFriends] = useState([]);
  const [loadingSelectedFriends, setLoadingSelectedFriends] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    const currentUserId = storedUser?.id || storedUser?._id || null;
    if (!currentUserId) return;

    const load = async () => {
      try {
        const data = await friendApi.getFriends(currentUserId);
        const mapped = (data || []).map((u) => {
          const name =
            u.username ||
            u.displayName ||
            u.fullName ||
            u.email ||
            "Người dùng";
          return {
            id: u.id || u._id || u.userId,
            name,
            avatar: u.avatar || null,
            status: u.status || "Online",
            lastActive: u.lastActive || "",
          };
        });
        setFriends(mapped);
        setSelectedFriendId(mapped[0]?.id ?? null);
      } catch (err) {
        toast.error(err?.message || "Không tải được danh sách bạn bè.");
      }
    };

    load();
  }, []);

  const selectedFriend =
    friends.find((f) => f.id === selectedFriendId) || friends[0] || null;

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(friendSearch.toLowerCase())
  );

  useEffect(() => {
    const fetchForSelected = async () => {
      if (!selectedFriend) {
        setPosts([]);
        setSelectedFriendFriends([]);
        return;
      }
      try {
        setLoadingPosts(true);
        setLoadingSelectedFriends(true);
        const [postsData, friendsData] = await Promise.all([
          postApi.getByAuthor(selectedFriend.id),
          friendApi.getFriends(selectedFriend.id),
        ]);
        setPosts(postsData || []);
        const mappedFriends = (friendsData || []).map((u) => ({
          id: u.id || u._id || u.userId,
          name:
            u.username ||
            u.displayName ||
            u.fullName ||
            u.email ||
            "Người dùng",
          avatar: u.avatar || null,
        }));
        setSelectedFriendFriends(mappedFriends);
      } catch {
        setPosts([]);
        setSelectedFriendFriends([]);
      } finally {
        setLoadingPosts(false);
        setLoadingSelectedFriends(false);
      }
    };

    fetchForSelected();
  }, [selectedFriend?.id]);

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

  const renderFriendsPreview = () => {
    return (
      <div className="mt-4 bg-white rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-base font-semibold text-gray-800">
            Bạn bè của {selectedFriend?.name || ""}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {loadingSelectedFriends ? (
            <p className="text-xs md:text-sm text-gray-500 col-span-3">
              Đang tải bạn bè...
            </p>
          ) : selectedFriendFriends.length === 0 ? (
            <p className="text-xs md:text-sm text-gray-500 col-span-3">
              Người này chưa có bạn bè hiển thị.
            </p>
          ) : (
            selectedFriendFriends.slice(0, 6).map((friend) => {
              const lastName =
                friend.name.split(" ").slice(-1)[0] || friend.name[0];
              const initial = lastName[0];
              return (
                <div
                  key={friend.id}
                  className="flex flex-col items-center text-center gap-1"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#FFE6DD] flex items-center justify-center text-sm font-semibold text-[#F58A4A] overflow-hidden">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  <p className="text-[11px] md:text-xs text-gray-700 line-clamp-2">
                    {friend.name}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout
      headerContent={headerContent}
      showSearch={false}
    >
      <div className="w-full h-full flex flex-col gap-4">
        {/* Tabs cho mobile */}
        <div className="md:hidden w-full bg-white rounded-2xl border border-gray-200 px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between gap-1 text-xs">
            <button
              type="button"
              onClick={() => navigate("/friends")}
              className="flex-1 px-2 py-1.5 rounded-full text-gray-600 hover:bg-gray-50"
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
              className="flex-1 px-2 py-1.5 rounded-full bg-[#FFF7F0] text-[#FA8DAE] font-semibold"
            >
              Tất cả bạn bè
            </button>
          </div>
        </div>

        <div className="w-full h-full flex flex-col md:flex-row gap-4">
        {/* Left column: friends list */}
        <aside className="w-full md:w-1/3 h-full bg-white text-gray-900 rounded-2xl border border-gray-200 p-3 md:p-4 flex flex-col space-y-3">
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

          {/* Search friends */}
          <div className="mt-2">
            <input
              type="text"
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Tìm kiếm bạn bè..."
              className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-xs md:text-sm outline-none focus:ring-2 focus:ring-[#FA8DAE]/40"
            />
          </div>

          <div className="mt-2 flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
            {filteredFriends.map((friend) => {
              const initial =
                friend.name.split(" ").slice(-1)[0]?.[0] || friend.name[0];
              const isActive =
                selectedFriend && selectedFriend.id === friend.id;
              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => {
                    // Trên mobile: đi thẳng tới trang cá nhân; desktop: chỉ chọn ở panel phải
                    if (window.innerWidth < 768) {
                      navigate(`/profile/${friend.id}`);
                    } else {
                      setSelectedFriendId(friend.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left ${
                    isActive ? "bg-[#FFF7F0]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#FFE6DD] flex items-center justify-center text-xs font-semibold text-[#F58A4A] overflow-hidden">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
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

            {filteredFriends.length === 0 && (
              <p className="text-[11px] text-gray-500 mt-2">
                Không tìm thấy bạn bè phù hợp.
              </p>
            )}
          </div>
        </aside>

        {/* Right column: selected friend + friends & posts */}
        <section className="flex-1 min-h-0 flex flex-col space-y-4">
          {selectedFriend ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 space-y-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#FFE6DD] flex items-center justify-center text-lg md:text-xl font-semibold text-[#F58A4A] overflow-hidden">
                      {selectedFriend.avatar ? (
                        <img
                          src={selectedFriend.avatar}
                          alt={selectedFriend.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedFriend.name.charAt(0)
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base md:text-xl font-semibold text-gray-900">
                      {selectedFriend.name}
                    </p>
                    <p className="text-[11px] md:text-xs text-gray-500">
                      {selectedFriend.status === "Online"
                        ? "Đang hoạt động"
                        : `Hoạt động gần đây: ${selectedFriend.lastActive}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${selectedFriend.id}`)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs md:text-sm font-semibold hover:bg-gray-200 transition"
                      >
                        Xem trang cá nhân
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/message")}
                        className="px-3 py-1.5 rounded-full bg-[#F9C96D] text-gray-800 text-xs md:text-sm font-semibold hover:bg-[#F7B944] transition"
                      >
                        Nhắn tin
                      </button>
                    </div>
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

                <div className="w-full lg:w-[70%] bg-white rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm md:text-base font-semibold text-gray-800">
                      Bài viết
                    </h3>
                  </div>
                  {loadingPosts ? (
                    <p className="text-xs md:text-sm text-gray-500">
                      Đang tải bài viết...
                    </p>
                  ) : posts.length === 0 ? (
                    <p className="text-xs md:text-sm text-gray-500">
                      Không có bài viết.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {posts.map((post) => (
                        <div
                          key={post.id || post._id}
                          className="border border-gray-100 rounded-xl px-3 py-2 text-xs md:text-sm text-gray-800 bg-gray-50"
                        >
                          <p className="font-semibold mb-1 line-clamp-1">
                            {post.title || "Bài viết"}
                          </p>
                          <p className="text-[11px] md:text-xs text-gray-600 line-clamp-3">
                            {post.content || post.text || "Không có nội dung hiển thị."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
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
      </div>
    </MainLayout>
  );
}
