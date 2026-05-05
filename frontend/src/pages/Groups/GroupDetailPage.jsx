import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Lock, Globe, Crown, Shield, User, Check, X, 
  MessageCircle, UserPlus, UserX, Pencil, Calendar, MapPin,
  Settings, MoreHorizontal, Bell, ImagePlus, Image, Send, Trash2,
  Edit, Ban, CheckCircle, Clock, FileText, CalendarDays, ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";
import MainLayout from "../../layouts/MainLayout";
import HomeCreatePost from "../Home/HomeCreatePost";
import HomePostCard from "../Home/HomePostCard";
import { groupApi } from "../../api/groupApi";
import { postApi } from "../../api/postApi";
import { friendApi } from "../../api/friendApi";
import { messageApi } from "../../api/messageApi";
import { uploadApi } from "../../api/uploadApi";

const ROLE_LABELS = { owner: "Nhóm trưởng", admin: "Nhóm phó", member: "Thành viên" };

export default function GroupDetailPage() {
  const { id } = useParams();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discussion");
  
  // Actions states
  const [joining, setJoining] = useState(false);
  const [joinRequested, setJoinRequested] = useState(false);
  
  // Admin states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  
  // Post modal states
  const [activePost, setActivePost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);
  const [friendsForShare, setFriendsForShare] = useState([]);
  const [loadingFriendsForShare, setLoadingFriendsForShare] = useState(false);
  const [sendingShare, setSendingShare] = useState(false);
  
  // Edit group states
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCover, setEditCover] = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [editAvatar, setEditAvatar] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    } catch {
      return null;
    }
  }, []);
  const currentUserId = currentUser?.id || currentUser?._id;
  const ownerName = currentUser?.username || currentUser?.email || currentUser?.name || "Bạn";

  const isMember = group?.members?.some((m) => m.userId === currentUserId);
  const myRole = group?.members?.find((m) => m.userId === currentUserId)?.role;
  const canManageGroup = myRole === "owner" || myRole === "admin";
  const canEditGroup = myRole === "owner";
  const isOwner = myRole === "owner";

  const withLikeState = (post) => {
    const likedBy = post.likedBy || [];
    const isLiked = currentUserId ? likedBy.includes(currentUserId) : false;
    return { ...post, isLiked };
  };

  // Fetch group info
  useEffect(() => {
    const fetchGroup = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await groupApi.getById(id);
        setGroup(data);
        setMembers(data?.members || []);
        setEditName(data?.name || "");
        setEditDescription(data?.description || "");
      } catch (err) {
        toast.error(err?.message || "Không tải được thông tin nhóm.");
        navigate("/groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id, navigate]);

  // Check join request status
  useEffect(() => {
    if (!id || !currentUserId || !group) return;
    if (group.visibility === "private" && !isMember) {
      groupApi.getMyJoinRequest(id)
        .then((r) => setJoinRequested(!!r))
        .catch(() => setJoinRequested(false));
    } else {
      setJoinRequested(false);
    }
  }, [id, currentUserId, group, isMember]);

  // Fetch pending requests
  useEffect(() => {
    if (!id || !canManageGroup) return;
    groupApi.getJoinRequests(id)
      .then((list) => setPendingRequests(list || []))
      .catch(() => setPendingRequests([]));
  }, [id, canManageGroup]);

  // Fetch posts
  useEffect(() => {
    if (!id || !currentUserId) return;
    const fetchPosts = async () => {
      try {
        const data = await postApi.getAll({ groupId: id, userId: currentUserId });
        // Backend trả về { posts: [...] } hoặc array trực tiếp
        const postsList = data?.posts || data || [];
        setPosts(Array.isArray(postsList) ? postsList.map(withLikeState) : []);
      } catch (err) {
        if (err?.response?.status !== 403) {
          toast.error(err?.message || "Không tải được bài viết.");
        }
        setPosts([]);
      }
    };
    fetchPosts();
  }, [id, currentUserId]);

  // Helper functions
  const selectedPostToShare = React.useMemo(
    () => posts.find((p) => (p.id || p._id) === sharePostId) || null,
    [posts, sharePostId]
  );

  const buildPostPreviewText = (post) => {
    if (!post) return "";
    const parts = [];
    if (post.text) {
      parts.push(post.text.length > 140 ? `${post.text.slice(0, 140)}…` : post.text);
    }
    if (!post.text && post.imageUrl) {
      return "Bài viết có hình ảnh";
    }
    if (parts.length === 0) {
      return "Bài viết trên bảng tin ChatWave";
    }
    return parts.join(" ");
  };

  // Handle functions
  const handleJoin = async () => {
    if (!currentUserId || !id) {
      toast.error("Bạn cần đăng nhập để tham gia nhóm.");
      return;
    }
    try {
      setJoining(true);
      const result = await groupApi.addMember(id, {
        userId: currentUserId,
        displayName: ownerName,
      });
      if (group?.visibility === "private" && result?.status === "pending") {
        setJoinRequested(true);
        toast.success("Đã gửi yêu cầu tham gia. Vui lòng chờ admin duyệt.");
      } else {
        const updated = await groupApi.getById(id);
        setGroup(updated);
        setMembers(updated?.members || []);
        toast.success("Đã tham gia nhóm!");
      }
    } catch (err) {
      toast.error(err?.message || "Không thể tham gia nhóm.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!(await confirm("Bạn có chắc muốn rời khỏi nhóm này?"))) return;
    try {
      setJoining(true);
      await groupApi.leaveGroup(id);
      toast.success("Bạn đã rời khỏi nhóm.");
      navigate("/groups");
    } catch (err) {
      toast.error(err?.message || "Không thể rời nhóm.");
    } finally {
      setJoining(false);
    }
  };

  const handleApproveJoinRequest = async (requestId) => {
    try {
      setProcessingRequest(requestId);
      await groupApi.approveJoinRequest(id, requestId);
      const [updatedGroup, requests] = await Promise.all([
        groupApi.getById(id),
        groupApi.getJoinRequests(id),
      ]);
      setGroup(updatedGroup);
      setMembers(updatedGroup?.members || []);
      setPendingRequests(requests || []);
      toast.success("Đã duyệt yêu cầu.");
    } catch (err) {
      toast.error(err?.message || "Không thể duyệt.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    try {
      setProcessingRequest(requestId);
      await groupApi.rejectJoinRequest(id, requestId);
      setPendingRequests((prev) => prev.filter((r) => (r.id || r._id) !== requestId));
      toast.success("Đã từ chối yêu cầu.");
    } catch (err) {
      toast.error(err?.message || "Không thể từ chối.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleUpdateRole = async (memberUserId, newRole) => {
    try {
      const updated = await groupApi.updateMemberRole(id, memberUserId, newRole);
      setGroup(updated);
      setMembers(updated?.members || []);
      toast.success(`Đã phân công ${ROLE_LABELS[newRole]}`);
    } catch (err) {
      toast.error(err?.message || "Không thể cập nhật vai trò.");
    }
  };

  const handleToggleVisibility = async () => {
    const next = group.visibility === "public" ? "private" : "public";
    try {
      const updated = await groupApi.updateVisibility(id, next, currentUserId);
      setGroup(updated);
      toast.success(`Đã chuyển nhóm sang ${next === "public" ? "Công khai" : "Riêng tư"}`);
    } catch (err) {
      toast.error(err?.message || "Không thể đổi quyền hiển thị.");
    }
  };

  const handleSaveGroupEdit = async () => {
    try {
      setCoverUploading(true);
      let coverUrl = group.coverImage || null;
      if (editCover) {
        const data = await uploadApi.uploadImage(editCover);
        coverUrl = data?.url || null;
      }
      
      let avatarUrl = group.avatar || null;
      if (editAvatar) {
        const data = await uploadApi.uploadImage(editAvatar);
        avatarUrl = data?.url || null;
      }
      
      const updated = await groupApi.update(id, {
        name: editName,
        description: editDescription,
        coverImage: coverUrl,
        avatar: avatarUrl,
      });
      setGroup(updated);
      setShowEditGroup(false);
      toast.success("Đã cập nhật thông tin nhóm.");
    } catch (err) {
      toast.error(err?.message || "Không thể cập nhật nhóm.");
    } finally {
      setCoverUploading(false);
      setAvatarUploading(false);
    }
  };

  const handleCreatePost = async ({ text, imageUrl, feeling, poll, scheduledAt }) => {
    try {
      const newPost = await postApi.create({
        authorId: currentUserId,
        authorName: ownerName,
        authorSubtitle: `Thành viên ${group?.name}`,
        authorAvatar: currentUser?.avatar || null,
        text,
        imageUrl,
        feeling,
        poll,
        scheduledAt,
        groupId: id,
      });
      setPosts((prev) => [withLikeState(newPost), ...prev]);
      if (scheduledAt) {
        toast.success("Bài viết đã được lên lịch đăng.");
      } else {
        toast.success("Đăng bài thành công!");
      }
    } catch (err) {
      toast.error(err?.message || "Không đăng được bài.");
    }
  };

  const handleToggleLike = async (postId) => {
    if (!currentUserId) return;
    try {
      const updated = await postApi.like(postId, currentUserId);
      setPosts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === postId ? withLikeState({ ...p, ...updated }) : p
        )
      );
    } catch (err) {
      toast.error(err?.message || "Không thể yêu thích.");
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const updated = await postApi.addComment(postId, {
        author: ownerName,
        authorAvatar: currentUser?.avatar || null,
        text,
      });
      setPosts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === postId ? withLikeState({ ...p, ...updated }) : p
        )
      );
    } catch (err) {
      toast.error(err?.message || "Không thể bình luận.");
    }
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

    const friendName = friend.username || friend.email || friend.name || friend.displayName || "Người bạn";
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
        senderName: ownerName,
        conversationName: `${ownerName} & ${friendName}`,
        text: previewText,
      });
      toast.success("Đã chia sẻ bài viết qua tin nhắn.");
      setSharePostId(null);
    } catch (err) {
      toast.error(err?.message || "Không chia sẻ được.");
    } finally {
      setSendingShare(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!(await confirm("Bạn có chắc muốn gỡ bài viết này?"))) return;
    try {
      await postApi.remove(postId);
      setPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
      toast.success("Đã gỡ bài viết.");
    } catch (err) {
      toast.error(err?.message || "Không gỡ được bài.");
    }
  };

  const handleEditPost = async (postId, payload) => {
    try {
      const updated = await postApi.update(postId, payload);
      setPosts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === postId ? withLikeState({ ...p, ...updated }) : p
        )
      );
      toast.success("Đã cập nhật bài viết.");
    } catch (err) {
      toast.error(err?.message || "Không cập nhật được.");
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!(await confirm(`Xóa ${memberName} khỏi nhóm?`))) return;
    try {
      await groupApi.removeMember(id, memberUserId);
      const updated = await groupApi.getById(id);
      setGroup(updated);
      setMembers(updated?.members || []);
      toast.success("Đã xóa thành viên.");
    } catch (err) {
      toast.error(err?.message || "Không thể xóa thành viên.");
    }
  };

  const headerContent = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => navigate("/groups")}
        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#FA8DAE]/20 flex items-center justify-center">
          <Users className="w-4 h-4 text-[#FA8DAE]" />
        </div>
        <span className="font-semibold text-gray-800 truncate">{group?.name || "Nhóm"}</span>
      </div>
    </div>
  );

  if (loading || !group) {
    return (
      <MainLayout headerContent={headerContent}>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#FA8DAE] border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const groupInitial = (group.name || "N")[0].toUpperCase();

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full bg-[#F0F2F5] min-h-screen">
        {/* Cover Image */}
        <div 
          className="h-48 md:h-56 lg:h-64 bg-linear-to-r from-[#FF9A44] to-[#FA8DAE] relative"
          style={group.coverImage ? { backgroundImage: `url(${group.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-black/10" />
          {canEditGroup && (
            <button
              type="button"
              onClick={() => {
                setShowEditGroup(true);
                setEditName(group.name || "");
                setEditDescription(group.description || "");
                setEditCoverPreview(null);
                setEditAvatarPreview(null);
              }}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-sm flex items-center gap-2 hover:bg-black/70 transition"
            >
              <ImagePlus className="w-4 h-4" />
              Chỉnh sửa ảnh bìa
            </button>
          )}
        </div>

        {/* Profile Info Section - Giống Facebook */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20 pb-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {group.avatar ? (
                    <img src={group.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl md:text-6xl font-bold text-[#FA8DAE]">{groupInitial}</span>
                  )}
                </div>
                {canEditGroup && (
                  <button
                    type="button"
                    onClick={() => setShowEditGroup(true)}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 hover:bg-gray-200 transition shadow"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Group Info */}
              <div className="flex-1 pb-2">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{group.name}</h1>
                      {group.visibility === "private" ? (
                        <Lock className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Globe className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
                      <span>{group.visibility === "private" ? "Nhóm riêng tư" : "Nhóm công khai"}</span>
                      <span>•</span>
                      <span>{members.length} thành viên</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {!isMember ? (
                      <button
                        type="button"
                        onClick={handleJoin}
                        disabled={joining || joinRequested}
                        className={`px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                          joinRequested
                            ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                            : "bg-[#FA8DAE] text-white hover:bg-[#E87A9B]"
                        }`}
                      >
                        {joining ? "Đang..." : joinRequested ? (
                          <>
                            <Clock className="w-5 h-5" />
                            Đang chờ duyệt
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            Tham gia nhóm
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg bg-[#F9C96D] text-gray-800 font-semibold flex items-center gap-2 hover:bg-[#F7B944] transition"
                        >
                          <Bell className="w-5 h-5" />
                          Đã thông báo
                        </button>
                        <button
                          type="button"
                          onClick={handleLeave}
                          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                        >
                          Rời nhóm
                        </button>
                      </>
                    )}
                    
                    {canEditGroup && (
                      <>
                        {pendingRequests.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowRequests(true)}
                            className="relative px-4 py-2 rounded-lg bg-[#FA8DAE] text-white font-semibold flex items-center gap-2 hover:bg-[#E87A9B] transition"
                          >
                            <Users className="w-5 h-5" />
                            Yêu cầu tham gia
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                              {pendingRequests.length}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowEditGroup(true)}
                          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition flex items-center gap-2"
                        >
                          <Edit className="w-5 h-5" />
                          Chỉnh sửa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-t border-gray-200 overflow-x-auto">
              {[
                { id: "discussion", label: "Thảo luận", icon: FileText },
                { id: "about", label: "Giới thiệu", icon: User },
                { id: "members", label: "Thành viên", icon: Users },
                { id: "photos", label: "Ảnh", icon: Image },
                { id: "settings", label: "Cài đặt", icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-[#FA8DAE] text-[#FA8DAE]"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - About */}
            <div className="w-full lg:w-80 shrink-0 space-y-4">
              {/* About Card */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Giới thiệu</h3>
                
                <div className="space-y-3 text-sm">
                  {group.description && (
                    <div className="pb-3 border-b border-gray-100">
                      <p className="text-gray-600 whitespace-pre-wrap">{group.description}</p>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{members.length} thành viên</p>
                    </div>
                  </div>
                  
                  {group.createdAt && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-600">
                          Được tạo vào {new Date(group.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    {group.visibility === "private" ? (
                      <Lock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    ) : (
                      <Globe className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {group.visibility === "private" ? "Nhóm riêng tư" : "Nhóm công khai"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {group.visibility === "private" 
                          ? "Chỉ thành viên mới xem bài viết" 
                          : "Mọi người đều có thể xem bài viết"}
                      </p>
                    </div>
                  </div>

                  {canEditGroup && (
                    <button
                      type="button"
                      onClick={() => setShowEditGroup(true)}
                      className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Chỉnh sửa thông tin nhóm
                    </button>
                  )}
                </div>
              </div>

              {/* Members Preview */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Thành viên</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className="text-sm text-[#FA8DAE] hover:underline"
                  >
                    Xem tất cả
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {members.slice(0, 6).map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      className="flex flex-col items-center text-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        m.role === "owner" ? "bg-linear-to-br from-[#FF9A44] to-[#FA8DAE]" :
                        m.role === "admin" ? "bg-linear-to-br from-[#6CB8FF] to-[#A78BFA]" :
                        "bg-gray-300"
                      }`}>
                        {(m.displayName || "?")[0].toUpperCase()}
                      </div>
                      <p className="text-xs text-gray-700 truncate w-full">{m.displayName}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 space-y-4">
              {/* Create Post */}
              {isMember && (
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#FF9A44] to-[#FA8DAE] flex items-center justify-center text-white font-semibold shrink-0">
                      {(ownerName)[0].toUpperCase()}
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById("group-create-post")?.scrollIntoView({ behavior: "smooth" })}
                      className="flex-1 text-left px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-500 text-sm"
                    >
                      Viết bài trong nhóm...
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content */}
              {activeTab === "discussion" && (
                <div id="group-create-post" className="space-y-4">
                  {isMember && (
                    <div className="bg-white rounded-xl shadow-sm p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Tạo bài viết</h3>
                      <HomeCreatePost onCreatePost={handleCreatePost} />
                    </div>
                  )}

                  {/* Posts */}
                  {posts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                      <p className="text-gray-500">Chưa có bài viết nào trong nhóm.</p>
                      {isMember && <p className="text-sm text-gray-400 mt-1">Hãy là người đầu tiên đăng bài!</p>}
                    </div>
                  ) : (
                    posts.map((post) => (
                      <HomePostCard
                        key={post.id || post._id}
                        post={post}
                        onToggleLike={handleToggleLike}
                        onAddComment={handleAddComment}
                        onShare={handleSharePost}
                        onDelete={canManageGroup ? handleDeletePost : null}
                        onEdit={canManageGroup ? handleEditPost : null}
                        onOpenComments={null}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "about" && (
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Giới thiệu về nhóm</h3>
                  
                  <div className="space-y-4">
                    {group.description && (
                      <div className="pb-4 border-b border-gray-100">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{group.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Ngày tạo</p>
                          <p className="text-sm text-gray-500">
                            {group.createdAt 
                              ? new Date(group.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })
                              : "Không rõ"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        {group.visibility === "private" ? (
                          <Lock className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                        ) : (
                          <Globe className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">Quyền riêng tư</p>
                          <p className="text-sm text-gray-500">
                            {group.visibility === "private" ? "Nhóm riêng tư" : "Nhóm công khai"}
                          </p>
                        </div>
                      </div>

                      {group.ownerName && (
                        <div className="flex items-start gap-3">
                          <Crown className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Người tạo</p>
                            <p className="text-sm text-gray-500">{group.ownerName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Thành viên ({members.length})</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Owner */}
                    {members.filter(m => m.role === "owner").map((m) => (
                      <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#FF9A44] to-[#FA8DAE] flex items-center justify-center text-white font-bold">
                          {(m.displayName || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{m.displayName}</p>
                          <p className="text-sm text-[#FA8DAE] flex items-center gap-1">
                            <Crown className="w-4 h-4" /> Nhóm trưởng
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Admins */}
                    {members.filter(m => m.role === "admin").map((m) => (
                      <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#6CB8FF] to-[#A78BFA] flex items-center justify-center text-white font-bold">
                          {(m.displayName || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{m.displayName}</p>
                          <p className="text-sm text-purple-600 flex items-center gap-1">
                            <Shield className="w-4 h-4" /> Nhóm phó
                          </p>
                        </div>
                        {isOwner && m.userId !== currentUserId && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateRole(m.userId, "member")}
                              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                              title="Hạ cấp"
                            >
                              <User className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId, m.displayName)}
                              className="p-2 rounded-full hover:bg-red-50 text-red-500"
                              title="Xóa khỏi nhóm"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Members */}
                    {members.filter(m => m.role === "member").map((m) => (
                      <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                          {(m.displayName || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{m.displayName}</p>
                          <p className="text-sm text-gray-400">Thành viên</p>
                        </div>
                        {canManageGroup && m.userId !== currentUserId && (
                          <div className="flex items-center gap-1">
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleUpdateRole(m.userId, "admin")}
                                className="p-2 rounded-full hover:bg-purple-50 text-purple-500"
                                title="Nâng cấp lên nhóm phó"
                              >
                                <Shield className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId, m.displayName)}
                              className="p-2 rounded-full hover:bg-red-50 text-red-500"
                              title="Xóa khỏi nhóm"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "photos" && (
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Ảnh</h3>
                  {posts.filter(p => p.imageUrl).length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {posts.filter(p => p.imageUrl).map((p) => (
                        <img
                          key={p.id || p._id}
                          src={p.imageUrl}
                          alt=""
                          className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                          onClick={() => {
                            setActivePost(p);
                            setIsModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Chưa có ảnh nào.</p>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Cài đặt nhóm</h3>
                  
                  {canEditGroup && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowEditGroup(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left"
                      >
                        <Edit className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">Chỉnh sửa nhóm</p>
                          <p className="text-sm text-gray-500">Đổi tên, mô tả, ảnh bìa</p>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleToggleVisibility}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left"
                      >
                        {group.visibility === "private" ? (
                          <Globe className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            Chuyển sang {group.visibility === "private" ? "Công khai" : "Riêng tư"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {group.visibility === "private" 
                              ? "Mọi người có thể tìm và xem bài viết" 
                              : "Chỉ thành viên mới xem được bài viết"}
                          </p>
                        </div>
                      </button>
                    </>
                  )}
                  
                  {isMember && (
                    <button
                      type="button"
                      onClick={handleLeave}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition text-left"
                    >
                      <UserX className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-medium text-red-600">Rời nhóm</p>
                        <p className="text-sm text-gray-500">Bạn sẽ không nhận được thông báo nữa</p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Group Modal */}
      {showEditGroup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">Chỉnh sửa nhóm</h3>
            
            {/* Cover Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa</label>
              <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                {editCoverPreview ? (
                  <img src={editCoverPreview} alt="Cover" className="w-full h-full object-cover" />
                ) : group.coverImage ? (
                  <img src={group.coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-r from-[#FF9A44] to-[#FA8DAE]" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditCover(file);
                        setEditCoverPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <ImagePlus className="w-8 h-8 text-white" />
                </label>
              </div>
            </div>
            
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar nhóm</label>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                  {editAvatarPreview ? (
                    <img src={editAvatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : group.avatar ? (
                    <img src={group.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-[#FF9A44] to-[#FA8DAE] flex items-center justify-center text-white text-2xl font-bold">
                      {groupInitial}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 cursor-pointer transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditAvatar(file);
                          setEditAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <ImagePlus className="w-6 h-6 text-white" />
                  </label>
                </div>
              </div>
            </div>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FA8DAE] focus:border-transparent"
                placeholder="Tên nhóm..."
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FA8DAE] focus:border-transparent"
                placeholder="Giới thiệu về nhóm..."
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEditGroup(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={coverUploading || avatarUploading}
                onClick={handleSaveGroupEdit}
                className="px-4 py-2 bg-[#FA8DAE] text-white rounded-lg text-sm font-medium hover:bg-[#E87A9B] disabled:opacity-60"
              >
                {coverUploading || avatarUploading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Yêu cầu tham gia ({pendingRequests.length})</h3>
              <button type="button" onClick={() => setShowRequests(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Không có yêu cầu nào.</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id || req._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#FA8DAE] to-[#FFB3C6] flex items-center justify-center text-white font-bold">
                      {(req.displayName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{req.displayName}</p>
                      <p className="text-xs text-gray-400">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString("vi-VN") : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={processingRequest === (req.id || req._id)}
                        onClick={() => handleApproveJoinRequest(req.id || req._id)}
                        className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        disabled={processingRequest === (req.id || req._id)}
                        onClick={() => handleRejectJoinRequest(req.id || req._id)}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Modal */}
      {isModalOpen && activePost && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-2">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm md:text-base font-semibold text-gray-800">
                Bài viết của {activePost.authorName}
              </h3>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setActivePost(null); }}
                className="text-gray-500 hover:text-gray-700 text-2xl px-2"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <HomePostCard
                post={activePost}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
                onShare={handleSharePost}
                onDelete={canManageGroup ? handleDeletePost : null}
                onEdit={canManageGroup ? handleEditPost : null}
                onOpenComments={() => {}}
                showAllComments
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharePostId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-2">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm md:text-base font-semibold text-gray-800">Chia sẻ bài viết</h3>
              <button type="button" onClick={() => setSharePostId(null)} className="text-gray-500 hover:text-gray-700 text-2xl px-2">
                ×
              </button>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Bạn muốn gửi bài viết này cho ai?</p>
              {selectedPostToShare && (
                <div className="p-3 rounded-xl bg-gray-50 text-sm text-gray-700 line-clamp-3">
                  {buildPostPreviewText(selectedPostToShare)}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loadingFriendsForShare ? (
                <p className="text-gray-500 text-center py-4">Đang tải danh sách bạn bè...</p>
              ) : friendsForShare.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Bạn chưa có bạn bè nào để chia sẻ.</p>
              ) : (
                friendsForShare.map((f) => {
                  const name = f.username || f.email || f.name || f.displayName || "Người bạn";
                  const initial = name.trim().charAt(0).toUpperCase();
                  return (
                    <button
                      key={f.id || f._id || f.userId}
                      type="button"
                      disabled={sendingShare}
                      onClick={() => handleSendShareToFriend(f)}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#FFE6DD] flex items-center justify-center text-[#F58A4A] font-semibold shrink-0">
                          {initial}
                        </div>
                        <span className="truncate font-medium text-gray-900">{name}</span>
                      </div>
                      <span className="text-sm text-[#FA8DAE]">
                        {sendingShare ? "Đang gửi..." : "Gửi"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
              <button type="button" onClick={() => setSharePostId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
