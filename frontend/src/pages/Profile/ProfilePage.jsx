import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, MapPin, Briefcase, GraduationCap, Calendar, MessageCircle, UserPlus, UserX } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { mockProfile } from "./profileData";
import { userApi } from "../../api/userApi";
import { friendApi } from "../../api/friendApi";
import { postApi } from "../../api/postApi";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { id: profileIdParam } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts"); // posts | about
  const [profile, setProfile] = useState(mockProfile);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [userFriends, setUserFriends] = useState([]);

  const storedUser =
    JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  const currentUserId = storedUser?.id || storedUser?._id || null;
  const currentUserName =
    storedUser?.username || storedUser?.email || storedUser?.name || "Bạn";

  const profileUserId = profileIdParam || currentUserId;
  const isMe =
    !profileIdParam ||
    !currentUserId ||
    String(profileUserId) === String(currentUserId);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        if (!profileUserId) {
          setProfile(mockProfile);
          setLoading(false);
          return;
        }

        const [fresh, posts, friends] = await Promise.all([
          userApi.getById(profileUserId),
          postApi.getByAuthor(profileUserId),
          friendApi.getFriends(profileUserId),
        ]);

        if (isMounted && fresh) {
          setProfile((prev) => ({
            ...prev,
            name: fresh.username || fresh.name || prev.name,
            username: fresh.email || prev.username,
            stats: {
              posts: posts?.length || 0,
              friends: friends?.length || 0,
              photos: (posts || []).filter((p) => p.imageUrl).length,
            },
          }));
          setUserPosts(posts || []);
          setUserFriends(friends || []);
        }
      } catch (err) {
        if (isMounted) {
          toast.error("Không tải được thông tin hồ sơ. Hiển thị dữ liệu mặc định.");
          setProfile(mockProfile);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchFriendState = async () => {
      if (!currentUserId || !profileUserId || isMe) return;
      try {
        const friends = await friendApi.getFriends(currentUserId);
        const found = (friends || []).some(
          (f) => String(f.id) === String(profileUserId)
        );
        if (isMounted) setIsFriend(found);
      } catch {
        // ignore friend state error
      }
    };

    fetchProfile();
    fetchFriendState();

    return () => {
      isMounted = false;
    };
  }, []);

  const { name, username, bio, stats, info } = profile;
  const initial = name.charAt(0);

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-sm md:text-base font-semibold text-gray-800">
        Trang cá nhân
      </h2>
      <span className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
        <User className="w-4 h-4" />
        {isMe ? "Hồ sơ của tôi" : "Hồ sơ người dùng"}
      </span>
    </div>
  );

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full max-w-4xl mx-auto py-6 space-y-6 px-2">
        {loading && (
          <p className="text-center text-sm text-gray-500">
            Đang tải hồ sơ...
          </p>
        )}
        {/* Cover + Avatar */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="h-32 md:h-40 bg-linear-to-r from-[#F5C46A] to-[#FA8DAE]" />
          <div className="px-4 pb-4 -mt-12 relative">
            <div className="w-24 h-24 rounded-2xl bg-[#FFF7F0] border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-[#FA8DAE]">
              {initial}
            </div>
            <h1 className="mt-3 text-xl md:text-2xl font-bold text-gray-900">
              {name}
            </h1>
            <p className="text-sm text-gray-500">@{username}</p>
            {bio && (
              <p className="mt-2 text-sm text-gray-700">{bio}</p>
            )}

            {!isMe && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/message")}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#F9C96D] text-gray-800 text-xs md:text-sm font-semibold hover:bg-[#F7B944] transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Nhắn tin
                </button>
                {isFriend ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (!currentUserId || !profileUserId) return;
                        await friendApi.removeFriend(
                          currentUserId,
                          profileUserId
                        );
                        setIsFriend(false);
                        toast.success("Đã huỷ kết bạn.");
                      } catch (err) {
                        toast.error(
                          err?.message || "Không huỷ kết bạn được."
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs md:text-sm font-semibold hover:bg-gray-200 transition"
                  >
                    <UserX className="w-4 h-4" />
                    Huỷ kết bạn
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (!currentUserId || !profileUserId) {
                          toast.error(
                            "Bạn cần đăng nhập để gửi lời mời kết bạn."
                          );
                          return;
                        }
                        await friendApi.sendRequest(
                          profileUserId,
                          currentUserId
                        );
                        toast.success("Đã gửi lời mời kết bạn.");
                      } catch (err) {
                        toast.error(
                          err?.message ||
                            "Không gửi được lời mời kết bạn."
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#FA8DAE] text-white text-xs md:text-sm font-semibold hover:opacity-90 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Kết bạn
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-xl font-bold text-[#FA8DAE]">{stats.posts}</p>
              <p className="text-xs text-gray-500">Bài viết</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#6CB8FF]">{stats.friends}</p>
              <p className="text-xs text-gray-500">Bạn bè</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#F9C96D]">{stats.photos}</p>
              <p className="text-xs text-gray-500">Ảnh</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl transition ${activeTab === "posts"
              ? "bg-[#FA8DAE] text-white"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Bài viết
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl transition ${activeTab === "about"
              ? "bg-[#FA8DAE] text-white"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Giới thiệu
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "posts" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
            {userPosts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">
                Chưa có bài viết nào. Chia sẻ điều gì đó từ trang chủ nhé!
              </p>
            ) : (
              <>
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="border border-gray-200 rounded-2xl p-3 md:p-4 space-y-2"
                  >
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                    {post.text && (
                      <p className="text-sm md:text-base text-gray-800">
                        {post.text}
                      </p>
                    )}
                    {post.imageUrl && (
                      <div className="overflow-hidden rounded-2xl border border-gray-100">
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="w-full max-h-[320px] object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {userPosts.some((p) => p.imageUrl) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Ảnh
                    </h3>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      {userPosts
                        .filter((p) => p.imageUrl)
                        .slice(0, 9)
                        .map((p) => (
                          <img
                            key={p.id}
                            src={p.imageUrl}
                            alt=""
                            className="w-full h-20 md:h-24 object-cover rounded-xl border border-gray-100"
                          />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
            <div className="space-y-3">
              {info.work && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Công việc</p>
                    <p className="text-sm font-medium text-gray-800">
                      {info.work}
                    </p>
                  </div>
                </div>
              )}
              {info.education && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Học vấn</p>
                    <p className="text-sm font-medium text-gray-800">
                      {info.education}
                    </p>
                  </div>
                </div>
              )}
              {info.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Nơi sống</p>
                    <p className="text-sm font-medium text-gray-800">
                      {info.location}
                    </p>
                  </div>
                </div>
              )}
              {info.joined && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Tham gia</p>
                    <p className="text-sm font-medium text-gray-800">
                      {info.joined}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">
                    {username}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Bạn bè ({userFriends.length})
              </h3>
              {userFriends.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Chưa có bạn bè nào hiển thị.
                </p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                  {userFriends.slice(0, 12).map((f) => {
                    const name = f.username || f.email || "User";
                    const initial = name.charAt(0);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => navigate(`/profile/${f.id}`)}
                        className="flex flex-col items-center text-center gap-1"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#FFE6DD] flex items-center justify-center text-xs md:text-sm font-semibold text-[#F58A4A]">
                          {initial}
                        </div>
                        <p className="text-[11px] md:text-xs text-gray-700 line-clamp-2">
                          {name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
