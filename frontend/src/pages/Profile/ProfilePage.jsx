import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, MapPin, Briefcase, GraduationCap, Calendar, MessageCircle, UserPlus, UserX, Pencil, Ban, ImagePlus, X, Image } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import HomePostCard from "../Home/HomePostCard";
import { mockProfile } from "./profileData";
import { userApi } from "../../api/userApi";
import { friendApi } from "../../api/friendApi";
import { postApi } from "../../api/postApi";
import { authApi } from "../../api/authApi";
import { uploadApi } from "../../api/uploadApi";
import { messageApi } from "../../api/messageApi";
import { useProfile } from "../../hooks/useProfile";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";

export default function ProfilePage() {
  const { id: profileIdParam } = useParams();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [clearAvatar, setClearAvatar] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);
  const [friendsForShare, setFriendsForShare] = useState([]);
  const [loadingFriendsForShare, setLoadingFriendsForShare] = useState(false);
  const [sendingShare, setSendingShare] = useState(false);

  const {
    profile,
    setProfile,
    loading,
    isFriend,
    setIsFriend,
    userPosts,
    setUserPosts,
    userFriends,
    currentUserId,
    profileUserId,
    isMe,
    updateProfile,
  } = useProfile(profileIdParam, mockProfile, {
    onError: () => toast.error("Không tải được thông tin hồ sơ. Hiển thị dữ liệu mặc định."),
  });

  const storedUser =
    JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  const currentUserName =
    storedUser?.username || storedUser?.email || storedUser?.name || "Bạn";

  const { name, username, bio, stats, info } = profile;
  const initial = name.charAt(0);

  const withLikeState = (post) => {
    const likedBy = post.likedBy || [];
    const isLiked = currentUserId
      ? likedBy.map(String).includes(String(currentUserId))
      : false;
    return { ...post, isLiked };
  };

  // Chỉ tính và hiển thị các bài viết cá nhân (không thuộc nhóm)
  const personalPosts = React.useMemo(
    () =>
      (userPosts || []).filter(
        (p) => !p.groupId && !p.chatGroupId && !p.chat_group_id
      ),
    [userPosts]
  );

  const selectedPostToShare = React.useMemo(
    () =>
      userPosts.find((p) => (p.id || p._id) === sharePostId) || null,
    [userPosts, sharePostId]
  );

  const buildPostPreviewText = (post) => {
    if (!post) return "";
    const parts = [];
    if (post.text) {
      parts.push(
        post.text.length > 140 ? `${post.text.slice(0, 140)}…` : post.text
      );
    }
    if (!post.text && post.imageUrl) {
      return "Bài viết có hình ảnh";
    }
    if (parts.length === 0) {
      return "Bài viết trên bảng tin ChatWave";
    }
    return parts.join(" ");
  };

  const handleSharePost = (postId) => {
    if (!currentUserId) {
      toast.error("Bạn cần đăng nhập để chia sẻ bài viết.");
      return;
    }
    setSharePostId(postId);
    if (!friendsForShare.length) {
      (async () => {
        try {
          setLoadingFriendsForShare(true);
          const data = await friendApi.getFriends(currentUserId);
          setFriendsForShare(data || []);
        } catch {
          setFriendsForShare([]);
        } finally {
          setLoadingFriendsForShare(false);
        }
      })();
    }
  };

  const handleSendShareToFriend = async (friend) => {
    if (!selectedPostToShare || !currentUserId) return;
    const friendId = friend?.id || friend?._id || friend?.userId;
    if (!friendId) return;

    const userA = String(currentUserId);
    const userB = String(friendId);
    const [a, b] = userA < userB ? [userA, userB] : [userB, userA];
    const conversationId = `direct:${a}:${b}`;

    const friendName =
      friend.username ||
      friend.email ||
      friend.name ||
      friend.displayName ||
      "Người bạn";

    const meta = {
      type: "post_share",
      postId: selectedPostToShare.id || selectedPostToShare._id,
      preview: buildPostPreviewText(selectedPostToShare),
      imageUrl: selectedPostToShare.imageUrl || null,
    };
    const previewText = `[POST_SHARE] ${JSON.stringify(meta)}`;

    try {
      setSendingShare(true);
      await messageApi.sendMessage(conversationId, {
        senderId: currentUserId,
        senderName: currentUserName,
        conversationName: `${currentUserName} & ${friendName}`,
        text: previewText,
      });
      toast.success("Đã chia sẻ bài viết qua tin nhắn.");
      setSharePostId(null);
    } catch (err) {
      toast.error(err?.message || "Không chia sẻ được bài viết.");
    } finally {
      setSendingShare(false);
    }
  };

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
      <div className="w-full bg-[#F0F2F5] min-h-screen">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#FA8DAE] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Cover Image */}
        <div
          className="h-48 md:h-56 lg:h-64 bg-linear-to-r from-[#FF9A44] to-[#FA8DAE] relative"
          style={profile.coverImage ? { backgroundImage: `url(${profile.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-black/10" />
          {isMe && (
            <button
              type="button"
              onClick={() => { setShowEditProfile(true); setEditBio(profile.bio || ""); setAvatarFile(null); setAvatarPreview(null); setClearAvatar(false); }}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-sm flex items-center gap-2 hover:bg-black/70 transition"
            >
              <ImagePlus className="w-4 h-4" />
              Chỉnh sửa ảnh bìa
            </button>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20 pb-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl md:text-6xl font-bold text-[#FA8DAE]">{initial}</span>
                  )}
                </div>
                {isMe && (
                  <button
                    type="button"
                    onClick={() => { setShowEditProfile(true); setEditBio(profile.bio || ""); setAvatarFile(null); setAvatarPreview(null); setClearAvatar(false); }}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 hover:bg-gray-200 transition shadow"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 pb-2">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{name}</h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
                      <span>@{username}</span>
                      <span>•</span>
                      <span>{personalPosts.length} bài viết</span>
                      <span>•</span>
                      <span>{stats.friends} bạn bè</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {isMe ? (
                      <button
                        type="button"
                        onClick={() => { setShowEditProfile(true); setEditBio(profile.bio || ""); setAvatarFile(null); setAvatarPreview(null); setClearAvatar(false); }}
                        className="px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 bg-[#F9C96D] text-gray-800 hover:bg-[#F7B944]"
                      >
                        <Pencil className="w-5 h-5" />
                        Chỉnh sửa
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => navigate("/message")}
                          className="px-4 py-2 rounded-lg bg-[#F9C96D] text-gray-800 font-semibold flex items-center gap-2 hover:bg-[#F7B944] transition"
                        >
                          <MessageCircle className="w-5 h-5" />
                          Nhắn tin
                        </button>
                        {isFriend ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                if (!currentUserId || !profileUserId) return;
                                await friendApi.removeFriend(currentUserId, profileUserId);
                                setIsFriend(false);
                                toast.success("Đã huỷ kết bạn.");
                              } catch (err) {
                                toast.error(err?.message || "Không huỷ kết bạn được.");
                              }
                            }}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                          >
                            <UserX className="w-5 h-5" />
                          </button>
                        ) : (
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
                            className="px-5 py-2 rounded-lg bg-[#FA8DAE] text-white font-semibold flex items-center gap-2 hover:opacity-90 transition"
                          >
                            <UserPlus className="w-5 h-5" />
                            Kết bạn
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!(await confirm("Chặn người dùng này?"))) return;
                            try {
                              await friendApi.block(currentUserId, profileUserId);
                              toast.success("Đã chặn người dùng.");
                              navigate(-1);
                            } catch (err) {
                              toast.error(err?.message || "Không chặn được.");
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-gray-200 text-red-600 font-medium hover:bg-red-50 transition"
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-sm text-gray-700 mb-4">{bio}</p>
            )}

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {[
                { key: "all", label: "Tất cả" },
                { key: "about", label: "Giới thiệu" },
                { key: "posts", label: "Bài viết" },
                { key: "friends", label: "Bạn bè" },
                { key: "photos", label: "Ảnh" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-[#FA8DAE] text-[#FA8DAE]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
          {/* About Tab */}
          {activeTab === "about" && (
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="space-y-3">
                {info.work && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Công việc</p>
                      <p className="text-sm font-medium text-gray-800">{info.work}</p>
                    </div>
                  </div>
                )}
                {info.education && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Học vấn</p>
                      <p className="text-sm font-medium text-gray-800">{info.education}</p>
                    </div>
                  </div>
                )}
                {info.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Nơi sống</p>
                      <p className="text-sm font-medium text-gray-800">{info.location}</p>
                    </div>
                  </div>
                )}
                {info.joined && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Tham gia</p>
                      <p className="text-sm font-medium text-gray-800">{info.joined}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-800">{username}</p>
                  </div>
                </div>
              </div>

              {isMe && (
                <div className="pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setShowEditProfile(true); setEditBio(profile.bio || ""); }}
                    className="text-sm text-[#FA8DAE] font-medium hover:underline"
                  >
                    Chỉnh sửa thông tin
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === "friends" && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Bạn bè ({userFriends.length})</h3>
              {userFriends.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Chưa có bạn bè nào.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {userFriends.map((f) => {
                    const name = f.username || f.email || "User";
                    const initial = name.charAt(0);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => navigate(`/profile/${f.id}`)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50"
                      >
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#FF9A44] to-[#FA8DAE] flex items-center justify-center text-white font-bold shrink-0">
                          {f.avatar ? (
                            <img src={f.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : initial}
                        </div>
                        <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === "photos" && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Ảnh</h3>
              {personalPosts.filter(p => p.imageUrl).length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {personalPosts.filter(p => p.imageUrl).map((p, idx) => (
                    <img key={idx} src={p.imageUrl} alt="" className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chưa có ảnh nào.</p>
                </div>
              )}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === "posts" && (
            <div className="space-y-4">
              {personalPosts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <p className="text-gray-500">Chưa có bài viết nào.</p>
                </div>
              ) : (
                personalPosts.map((post) => (
                  <HomePostCard
                    key={post.id || post._id}
                    post={post}
                    onToggleLike={async (id) => {
                      try {
                        const updated = await postApi.like(id, currentUserId);
                        setUserPosts((prev) =>
                          prev.map((p) =>
                            (p.id || p._id) === id
                              ? withLikeState({ ...p, ...updated })
                              : p
                          )
                        );
                      } catch (err) {
                        toast.error(err?.message || "Không thể thích bài viết.");
                      }
                    }}
                    onAddComment={async (id, text) => {
                      try {
                        const user = JSON.parse(localStorage.getItem("chatwave_user") || "null") || {};
                        if (!user || (!user.username && !user.email)) {
                          toast.error("Bạn cần đăng nhập để bình luận.");
                          return;
                        }
                        const updated = await postApi.addComment(id, {
                          author: user.username || "User",
                          authorAvatar: user.avatar || null,
                          text,
                        });
                        setUserPosts((prev) =>
                          prev.map((p) =>
                            (p.id || p._id) === id
                              ? withLikeState({ ...p, ...updated })
                              : p
                          )
                        );
                      } catch (err) {
                        toast.error(err?.message || "Không thêm được bình luận.");
                      }
                    }}
                    onShare={handleSharePost}
                    onDelete={isMe ? async (id) => {
                      if (!(await confirm("Bạn có chắc muốn gỡ bài viết này?"))) return;
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
                    onOpenComments={null}
                  />
                ))
              )}
            </div>
          )}

          {/* All Tab - Default */}
          {activeTab === "all" && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                {bio && (
                  <>
                    <h3 className="font-semibold text-gray-900">Giới thiệu</h3>
                    <p className="text-sm text-gray-600">{bio}</p>
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setActiveTab("about")}
                        className="text-sm text-[#FA8DAE] font-medium hover:underline"
                      >
                        Xem thêm thông tin
                      </button>
                    </div>
                  </>
                )}
                {userFriends.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Bạn bè ({userFriends.length})</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("friends")}
                        className="text-sm text-[#FA8DAE] hover:underline"
                      >
                        Xem tất cả
                      </button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {userFriends.slice(0, 8).map((f) => {
                        const name = f.username || f.email || "User";
                        const initial = name.charAt(0);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => navigate(`/profile/${f.id}`)}
                            className="flex flex-col items-center text-center gap-1 p-2 rounded-lg hover:bg-gray-50"
                          >
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#FF9A44] to-[#FA8DAE] flex items-center justify-center text-white font-bold text-sm">
                              {f.avatar ? (
                                <img src={f.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : initial}
                            </div>
                            <p className="text-xs text-gray-700 truncate w-full">{name}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {personalPosts.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <p className="text-gray-500">Chưa có bài viết nào.</p>
                  </div>
                ) : (
                  personalPosts.map((post) => (
                    <HomePostCard
                      key={post.id || post._id}
                      post={post}
                      onToggleLike={async (id) => {
                        try {
                          const updated = await postApi.like(id, currentUserId);
                          setUserPosts((prev) =>
                            prev.map((p) =>
                              (p.id || p._id) === id
                                ? withLikeState({ ...p, ...updated })
                                : p
                            )
                          );
                        } catch (err) {
                          toast.error(err?.message || "Không thể thích bài viết.");
                        }
                      }}
                      onAddComment={async (id, text) => {
                        try {
                          const user = JSON.parse(localStorage.getItem("chatwave_user") || "null") || {};
                          if (!user || (!user.username && !user.email)) {
                            toast.error("Bạn cần đăng nhập để bình luận.");
                            return;
                          }
                          const updated = await postApi.addComment(id, {
                            author: user.username || "User",
                            authorAvatar: user.avatar || null,
                            text,
                          });
                          setUserPosts((prev) =>
                            prev.map((p) =>
                              (p.id || p._id) === id
                                ? withLikeState({ ...p, ...updated })
                                : p
                            )
                          );
                        } catch (err) {
                          toast.error(err?.message || "Không thêm được bình luận.");
                        }
                      }}
                      onShare={handleSharePost}
                      onDelete={isMe ? async (id) => {
                        if (!(await confirm("Bạn có chắc muốn gỡ bài viết này?"))) return;
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
                      onOpenComments={null}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
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
                    Chọn ảnh
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

      {sharePostId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-2">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm md:text-base font-semibold text-gray-800">
                Chia sẻ bài viết
              </h3>
              <button
                type="button"
                onClick={() => setSharePostId(null)}
                className="text-gray-500 hover:text-gray-700 text-lg px-2"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                Bạn muốn gửi bài viết này cho ai?
              </p>
              {selectedPostToShare && (
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 line-clamp-3">
                  {buildPostPreviewText(selectedPostToShare)}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loadingFriendsForShare ? (
                <p className="text-xs text-gray-500">
                  Đang tải danh sách bạn bè...
                </p>
              ) : friendsForShare.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Bạn chưa có bạn bè nào để chia sẻ. Hãy kết bạn trước nhé.
                </p>
              ) : (
                friendsForShare.map((f) => {
                  const name =
                    f.username ||
                    f.email ||
                    f.name ||
                    f.displayName ||
                    "Người bạn";
                  const initial = name.trim().charAt(0).toUpperCase();
                  return (
                    <button
                      key={f.id || f._id || f.userId}
                      type="button"
                      disabled={sendingShare}
                      onClick={() => handleSendShareToFriend(f)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-left text-xs md:text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#FFE6DD] flex items-center justify-center text-[11px] font-semibold text-[#F58A4A] shrink-0">
                          {initial}
                        </div>
                        <span className="truncate">{name}</span>
                      </div>
                      <span className="text-[11px] md:text-xs text-[#FA8DAE]">
                        {sendingShare ? "Đang gửi..." : "Gửi"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSharePostId(null)}
                className="px-3 py-1.5 rounded-full border border-gray-300 text-xs text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
