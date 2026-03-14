import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Lock, Crown, Shield, User, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";
import MainLayout from "../../layouts/MainLayout";
import HomeCreatePost from "../Home/HomeCreatePost";
import HomePostCard from "../Home/HomePostCard";
import { groupApi } from "../../api/groupApi";
import { postApi } from "../../api/postApi";

const ROLE_LABELS = { owner: "Nhóm trưởng", admin: "Nhóm phó", member: "Thành viên" };

export default function GroupDetailPage() {
  const { id } = useParams();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [joinRequested, setJoinRequested] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processingRequest, setProcessingRequest] = useState(null);

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
  const canAssignAdmin = myRole === "owner";
  const canLeaveGroup = isMember && myRole !== "owner";

  const withLikeState = (post) => {
    const likedBy = post.likedBy || [];
    const isLiked = currentUserId ? likedBy.includes(currentUserId) : false;
    return { ...post, isLiked };
  };

  useEffect(() => {
    const fetchGroup = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await groupApi.getById(id);
        setGroup(data);
      } catch (err) {
        toast.error(err?.message || "Không tải được thông tin nhóm.");
        navigate("/groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !currentUserId || !group) return;
    if (group.visibility === "private" && !isMember) {
      groupApi
        .getMyJoinRequest(id)
        .then((r) => setJoinRequested(!!r))
        .catch(() => setJoinRequested(false));
    } else {
      setJoinRequested(false);
    }
  }, [id, currentUserId, group, isMember]);

  useEffect(() => {
    if (!id || !canManageGroup) return;
    groupApi
      .getJoinRequests(id)
      .then((list) => setPendingRequests(list || []))
      .catch(() => setPendingRequests([]));
  }, [id, canManageGroup]);

  useEffect(() => {
    if (!id || !currentUserId || !isMember) return;

    const fetchPosts = async () => {
      try {
        const data = await postApi.getAll({ groupId: id, userId: currentUserId });
        setPosts((data || []).map(withLikeState));
      } catch (err) {
        if (err?.response?.status === 403) {
          setPosts([]);
        } else {
          toast.error(err?.message || "Không tải được bài viết.");
        }
      }
    };
    fetchPosts();
  }, [id, currentUserId, isMember]);

  const handleToggleVisibility = async () => {
    if (!canManageGroup || !id) return;
    const next = group.visibility === "public" ? "private" : "public";
    try {
      setTogglingVisibility(true);
      const updated = await groupApi.updateVisibility(id, next, currentUserId);
      setGroup(updated);
      toast.success(`Đã chuyển nhóm sang ${next === "public" ? "Công khai" : "Riêng tư"}`);
    } catch (err) {
      toast.error(err?.message || "Không thể đổi quyền hiển thị.");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleUpdateRole = async (memberUserId, newRole) => {
    if (!canManageGroup || !id) return;
    if (newRole === "admin" && !canAssignAdmin) return;
    if (memberUserId === currentUserId && myRole === "owner") return;
    try {
      setUpdatingRole(memberUserId);
      const updated = await groupApi.updateMemberRole(id, memberUserId, newRole);
      setGroup(updated);
      toast.success(`Đã phân công ${ROLE_LABELS[newRole]}`);
    } catch (err) {
      toast.error(err?.message || "Không thể cập nhật vai trò.");
    } finally {
      setUpdatingRole(null);
    }
  };

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
        toast.success("Đã tham gia nhóm!");
      }
    } catch (err) {
      toast.error(err?.message || "Không thể tham gia nhóm.");
    } finally {
      setJoining(false);
    }
  };

  const handleApproveJoinRequest = async (requestId) => {
    if (!canManageGroup || !id) return;
    try {
      setProcessingRequest(requestId);
      await groupApi.approveJoinRequest(id, requestId);
      const [updatedGroup, requests] = await Promise.all([
        groupApi.getById(id),
        groupApi.getJoinRequests(id),
      ]);
      setGroup(updatedGroup);
      setPendingRequests(requests || []);
      toast.success("Đã duyệt yêu cầu tham gia.");
    } catch (err) {
      toast.error(err?.message || "Không thể duyệt.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    if (!canManageGroup || !id) return;
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

  const handleLeave = async () => {
    if (!canLeaveGroup || !id || !currentUserId) return;
    if (!(await confirm("Bạn có chắc muốn rời khỏi nhóm này?"))) return;
    try {
      setJoining(true);
      await groupApi.removeMember(id, currentUserId);
      toast.success("Bạn đã rời khỏi nhóm.");
      navigate("/groups");
    } catch (err) {
      toast.error(err?.message || "Không thể rời nhóm, vui lòng thử lại.");
    } finally {
      setJoining(false);
    }
  };

  const handleCreatePost = async ({ text, imageUrl }) => {
    if (!isMember || !currentUserId) {
      toast.error("Bạn cần tham gia nhóm để đăng bài.");
      return;
    }
    try {
      const newPost = await postApi.create({
        authorId: currentUserId,
        authorName: ownerName,
        authorSubtitle: `Thành viên ${group?.name}`,
        text,
        imageUrl,
        groupId: id,
      });
      setPosts((prev) => [withLikeState(newPost), ...prev]);
      toast.success("Đăng bài thành công!");
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
      setActivePost((prev) =>
        prev && (prev.id || prev._id) === postId
          ? withLikeState({ ...prev, ...updated })
          : prev
      );
    } catch (err) {
      toast.error(err?.message || "Không thể yêu thích.");
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!currentUserId) return;
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
      setActivePost((prev) =>
        prev && (prev.id || prev._id) === postId
          ? withLikeState({ ...prev, ...updated })
          : prev
      );
    } catch (err) {
      toast.error(err?.message || "Không thể bình luận.");
    }
  };

  const handleShare = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        (p.id || p._id) === postId ? { ...p, shares: (p.shares || 0) + 1 } : p
      )
    );
  };

  const handleDeletePost = async (postId) => {
    if (!(await confirm("Bạn có chắc muốn gỡ bài viết này?"))) return;
    try {
      await postApi.remove(postId);
      setPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
      setActivePost((prev) =>
        prev && (prev.id || prev._id) === postId ? null : prev
      );
      setIsModalOpen(false);
      toast.success("Đã gỡ bài viết.");
    } catch (err) {
      toast.error(err?.message || "Không gỡ được bài.");
    }
  };

  if (loading || !group) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto py-4 md:py-6">
        <button
          type="button"
          onClick={() => navigate("/groups")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách nhóm
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 mb-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#FA8DAE]/20 flex items-center justify-center shrink-0">
              <Users className="w-8 h-8 text-[#FA8DAE]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-800">{group.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {group.description || "Chưa có mô tả"}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {canManageGroup ? (
                  <button
                    type="button"
                    onClick={handleToggleVisibility}
                    disabled={togglingVisibility}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      group.visibility === "private"
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    } disabled:opacity-60`}
                    title="Bấm để đổi Công khai ↔ Riêng tư"
                  >
                    {togglingVisibility
                      ? "Đang đổi..."
                      : group.visibility === "private"
                      ? "Riêng tư"
                      : "Công khai"}
                  </button>
                ) : (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      group.visibility === "private"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {group.visibility === "private" ? "Riêng tư" : "Công khai"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    (group.members?.length || 0) > 0 && setShowMembersModal(true)
                  }
                  className="text-xs text-gray-600 hover:text-[#FA8DAE] hover:underline cursor-pointer transition-colors"
                  title="Xem thành viên & phân công"
                >
                  {group.members?.length || 0} thành viên
                </button>
              </div>
              {!isMember && (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining || joinRequested}
                  className={`mt-3 px-4 py-2 rounded-full text-sm font-semibold ${
                    joinRequested
                      ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                      : "bg-[#FA8DAE] text-white hover:opacity-90 disabled:opacity-60"
                  }`}
                >
                  {joining
                    ? "Đang gửi..."
                    : joinRequested
                    ? "Chờ duyệt"
                    : group.visibility === "private"
                    ? "Yêu cầu tham gia"
                    : "Tham gia nhóm"}
                </button>
              )}
              {canLeaveGroup && (
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={joining}
                  className="mt-3 ml-0 md:ml-3 px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Rời nhóm
                </button>
              )}
            </div>
          </div>
        </div>

        {showMembersModal && group.members?.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-3"
            onClick={() => setShowMembersModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
                <h3 className="text-base font-semibold text-gray-800">
                  Thành viên & phân công
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl px-2"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {canManageGroup && pendingRequests.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Yêu cầu chờ duyệt</h4>
                    {pendingRequests.map((r) => (
                      <div
                        key={r.id || r._id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50"
                      >
                        <span className="text-sm text-gray-800">{r.displayName}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleApproveJoinRequest(r.id || r._id)}
                            disabled={processingRequest === (r.id || r._id)}
                            className="p-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60"
                            title="Duyệt"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectJoinRequest(r.id || r._id)}
                            disabled={processingRequest === (r.id || r._id)}
                            className="p-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                            title="Từ chối"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {group.members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {m.displayName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                          m.role === "owner"
                            ? "bg-amber-100 text-amber-800"
                            : m.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {m.role === "owner" && <Crown className="w-3 h-3" />}
                        {m.role === "admin" && <Shield className="w-3 h-3" />}
                        {m.role === "member" && <User className="w-3 h-3" />}
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    </div>
                    {isMember &&
                      canAssignAdmin &&
                      m.userId !== currentUserId &&
                      m.role !== "owner" && (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleUpdateRole(m.userId, e.target.value)
                          }
                          disabled={!!updatingRole}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          {canAssignAdmin && (
                            <option value="admin">Nhóm phó</option>
                          )}
                          <option value="member">Thành viên</option>
                        </select>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isMember ? (
          <>
            <HomeCreatePost onCreatePost={handleCreatePost} />

            <div className="mt-4 text-sm text-gray-500 mb-2">
              Bài viết trong nhóm (chỉ thành viên mới xem được)
            </div>

            <div className="flex flex-col gap-4">
              {posts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Chưa có bài viết nào trong nhóm.
                </p>
              ) : (
                posts.map((post) => (
                  <HomePostCard
                    key={post.id || post._id}
                    post={post}
                    onToggleLike={handleToggleLike}
                    onAddComment={handleAddComment}
                    onShare={handleShare}
                    onDelete={handleDeletePost}
                    onOpenComments={(p) => {
                      setActivePost(p);
                      setIsModalOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Lock className="w-12 h-12 text-gray-300 mb-3 mx-auto" />
            <p className="text-gray-600">
              {joinRequested ? "Đã gửi yêu cầu. Vui lòng chờ admin duyệt." : "Tham gia nhóm để xem và đăng bài viết."}
            </p>
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || joinRequested}
              className={`mt-4 px-6 py-2 rounded-full text-sm font-semibold ${
                joinRequested
                  ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                  : "bg-[#FA8DAE] text-white hover:opacity-90 disabled:opacity-60"
              }`}
            >
              {joining ? "Đang gửi..." : joinRequested ? "Chờ duyệt" : group.visibility === "private" ? "Yêu cầu tham gia" : "Tham gia nhóm"}
            </button>
          </div>
        )}
      </div>

      {isModalOpen && activePost && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-2">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm md:text-base font-semibold text-gray-800">
                Bài viết của {activePost.authorName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setActivePost(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-lg px-2"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <HomePostCard
                post={activePost}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
                onShare={handleShare}
                onDelete={handleDeletePost}
                onOpenComments={() => {}}
                showAllComments
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
