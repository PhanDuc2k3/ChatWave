import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, MapPin, Briefcase, GraduationCap, Calendar, MessageCircle, UserPlus, UserX, Pencil, Ban, ImagePlus, X } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import HomePostCard from "../Home/HomePostCard";
import { mockProfile } from "./profileData";
import { userApi } from "../../api/userApi";
import { friendApi } from "../../api/friendApi";
import { postApi } from "../../api/postApi";
import { authApi } from "../../api/authApi";
import { uploadApi } from "../../api/uploadApi";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { id: profileIdParam } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // all | about | posts | friends | photos
  const [profile, setProfile] = useState(mockProfile);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [clearAvatar, setClearAvatar] = useState(false);
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
            bio: fresh.bio ?? prev.bio,
            avatar: fresh.avatar ?? prev.avatar,
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
            <div className="w-24 h-24 rounded-2xl bg-[#FFF7F0] border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-[#FA8DAE]">{initial}</span>
              )}
            </div>
            {isMe && (
              <button
                type="button"
                onClick={() => { setShowEditProfile(true); setEditBio(profile.bio || ""); setAvatarFile(null); setAvatarPreview(null); setClearAvatar(false); }}
                className="absolute top-2 right-4 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#FA8DAE]/20 hover:text-[#FA8DAE] transition"
                title="Chỉnh sửa hồ sơ"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
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
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (!currentUserId || !profileUserId) {
                            toast.error("Bạn cần đăng nhập để gửi lời mời kết bạn.");
                            return;
                          }
                          await friendApi.sendRequest(profileUserId, currentUserId);
                          toast.success("Đã gửi lời mời kết bạn.");
                        } catch (err) {
                          toast.error(err?.message || "Không gửi được lời mời kết bạn.");
                        }
                      }}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#FA8DAE] text-white text-xs md:text-sm font-semibold hover:opacity-90 transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      Kết bạn
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Chặn người dùng này?")) return;
                        try {
                          await friendApi.block(currentUserId, profileUserId);
                          toast.success("Đã chặn người dùng.");
                          navigate(-1);
                        } catch (err) {
                          toast.error(err?.message || "Không chặn được.");
                        }
                      }}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gray-100 text-red-600 text-xs md:text-sm font-semibold hover:bg-red-50 transition"
                    >
                      <Ban className="w-4 h-4" />
                      Chặn
                    </button>
                  </>
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
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl whitespace-nowrap transition ${
              activeTab === "all"
              ? "bg-[#FA8DAE] text-white"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl whitespace-nowrap transition ${
              activeTab === "about"
              ? "bg-[#FA8DAE] text-white"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Giới thiệu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl whitespace-nowrap transition ${
              activeTab === "posts"
                ? "bg-[#FA8DAE] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Bài viết
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl whitespace-nowrap transition ${
              activeTab === "friends"
                ? "bg-[#FA8DAE] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Bạn bè
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl whitespace-nowrap transition ${
              activeTab === "photos"
                ? "bg-[#FA8DAE] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Ảnh
          </button>
        </div>

        {/* Tab content */}
        {(activeTab === "posts" || activeTab === "all") ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
            {userPosts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">
                Chưa có bài viết nào. Chia sẻ điều gì đó từ trang chủ nhé!
              </p>
            ) : (
              userPosts.map((post) => (
                <HomePostCard
                  key={post.id || post._id}
                  post={post}
                  onToggleLike={async (id) => {
                    try {
                      const updated = await postApi.like(id, currentUserId);
                      setUserPosts((prev) =>
                        prev.map((p) =>
                          (p.id || p._id) === id ? { ...p, ...updated } : p
                        )
                      );
                    } catch (err) {
                      toast.error(err?.message || "Không thể thích bài viết.");
                    }
                  }}
                  onAddComment={async (id, text) => {
                    try {
                      const updated = await postApi.addComment(id, { text });
                      setUserPosts((prev) =>
                        prev.map((p) =>
                          (p.id || p._id) === id ? { ...p, ...updated } : p
                        )
                      );
                    } catch (err) {
                      toast.error(err?.message || "Không thêm được bình luận.");
                    }
                  }}
                  onShare={null}
                  onDelete={isMe ? async (id) => {
                    if (!window.confirm("Bạn có chắc muốn gỡ bài viết này?")) return;
                    try {
                      await postApi.remove(id);
                      setUserPosts((prev) =>
                        prev.filter((p) => (p.id || p._id) !== id)
                      );
                      toast.success("Đã gỡ bài viết.");
                    } catch (err) {
                      toast.error(err?.message || "Không gỡ được bài viết.");
                    }
                  } : null}
                  onEdit={isMe ? async (id, payload) => {
                    try {
                      const updated = await postApi.update(id, payload);
                      setUserPosts((prev) =>
                        prev.map((p) =>
                          (p.id || p._id) === id ? { ...p, ...updated } : p
                        )
                      );
                      toast.success("Đã cập nhật bài viết.");
                    } catch (err) {
                      toast.error(err?.message || "Không cập nhật được bài viết.");
                    }
                  } : null}
                  onOpenComments={() => {}}
                  showAllComments
                />
              ))
            )}
          </div>
        ) : activeTab === "about" ? (
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

            {/* Nút chỉnh sửa thêm thông tin nếu là chủ tài khoản */}
            {isMe && (
              <div className="pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(true);
                    setEditBio(profile.bio || "");
                  }}
                  className="text-sm text-[#FA8DAE] font-medium hover:underline"
                >
                  Chỉnh sửa thông tin
                </button>
              </div>
            )}

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
        ) : activeTab === "friends" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Bạn bè ({userFriends.length})
            </h3>
            {userFriends.length === 0 ? (
              <p className="text-xs text-gray-500">
                Chưa có bạn bè nào hiển thị.
              </p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                {userFriends.map((f) => {
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
        ) : (
          /* Photos tab */
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Ảnh từ bài viết
            </h3>
            {userPosts.some((p) => p.imageUrl) ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                {userPosts
                  .filter((p) => p.imageUrl)
                  .map((p) => (
                    <img
                      key={p.id}
                      src={p.imageUrl}
                      alt=""
                      className="w-full h-24 md:h-28 object-cover rounded-xl border border-gray-100"
                    />
                  ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Chưa có ảnh nào từ bài viết.
              </p>
            )}
          </div>
        )}
      </div>

      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Chỉnh sửa hồ sơ</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Avatar</label>
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {avatarPreview ? (
                    <>
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                          setClearAvatar(false);
                          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                        aria-label="Xóa ảnh"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : clearAvatar ? (
                    <span className="text-2xl font-bold text-[#FA8DAE]">{profile.name?.charAt(0) || "U"}</span>
                  ) : profile.avatar ? (
                    <>
                      <img src={profile.avatar} alt="Hiện tại" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setClearAvatar(true)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 text-[10px]"
                        aria-label="Xóa avatar"
                        title="Xóa ảnh đại diện"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-[#FA8DAE]">{profile.name?.charAt(0) || "U"}</span>
                  )}
                </div>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        toast.error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp).");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Ảnh tối đa 5MB.");
                        return;
                      }
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    <ImagePlus className="w-4 h-4" />
                    Chọn ảnh (Cloudinary)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Giới thiệu (bio)</label>
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Giới thiệu về bạn..." />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowEditProfile(false); setAvatarFile(null); setAvatarPreview(null); setClearAvatar(false); if (avatarPreview) URL.revokeObjectURL(avatarPreview); }} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
              <button
                type="button"
                disabled={avatarUploading}
                onClick={async () => {
                  try {
                    let finalAvatarUrl = null;
                    if (clearAvatar) {
                      finalAvatarUrl = null;
                    } else if (avatarFile) {
                      setAvatarUploading(true);
                      const data = await uploadApi.uploadImage(avatarFile);
                      finalAvatarUrl = data?.url || null;
                      if (!finalAvatarUrl) {
                        toast.error("Tải ảnh lên thất bại.");
                        setAvatarUploading(false);
                        return;
                      }
                    } else {
                      finalAvatarUrl = profile.avatar || null;
                    }
                    const updated = await userApi.update(profileUserId, { bio: editBio, avatar: finalAvatarUrl });
                    setProfile((p) => ({ ...p, bio: updated.bio ?? editBio, avatar: updated.avatar ?? finalAvatarUrl }));
                    setShowEditProfile(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    toast.success("Đã cập nhật hồ sơ.");
                    const stored = JSON.parse(localStorage.getItem("chatwave_user") || "{}");
                    if (stored && (stored.id === profileUserId || stored._id === profileUserId)) {
                      localStorage.setItem("chatwave_user", JSON.stringify({ ...stored, bio: updated.bio, avatar: updated.avatar }));
                    }
                  } catch (err) {
                    toast.error(err?.message || "Không cập nhật được.");
                  } finally {
                    setAvatarUploading(false);
                  }
                }}
                className="px-4 py-2 bg-[#FA8DAE] text-white rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {avatarUploading ? "Đang tải ảnh..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
