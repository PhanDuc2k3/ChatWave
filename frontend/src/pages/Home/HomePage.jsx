import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import MainLayout from "../../layouts/MainLayout";
import HomeCreatePost from "./HomeCreatePost";
import HomePostCard from "./HomePostCard";
import { postApi } from "../../api/postApi";
import { friendApi } from "../../api/friendApi";
import { messageApi } from "../../api/messageApi";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePost, setActivePost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sendingShare, setSendingShare] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const storedUser =
    JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  const currentUserId = storedUser?.id || storedUser?._id || null;
  const currentUserName =
    storedUser?.username || storedUser?.email || storedUser?.name || "Bạn";

  const withLikeState = (post) => {
    const likedBy = post.likedBy || [];
    const isLiked = currentUserId ? likedBy.includes(currentUserId) : false;
    return { ...post, isLiked };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await postApi.getAll();
        if (isMounted) {
          setPosts((data || []).map(withLikeState));
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Không tải được danh sách bài viết.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Nếu có ?postId= trên URL (từ trang Message), tự mở popup bài viết tương ứng
  useEffect(() => {
    if (!posts.length) return;
    const params = new URLSearchParams(location.search);
    const postIdParam = params.get("postId");
    if (!postIdParam) return;

    const found =
      posts.find(
        (p) => String(p.id || p._id) === String(postIdParam)
      ) || null;
    if (found) {
      setActivePost(found);
      setIsModalOpen(true);
    }

    // Xoá postId khỏi URL để tránh mở lại nhiều lần
    params.delete("postId");
    navigate(
      { pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" },
      { replace: true }
    );
  }, [posts, location.search, navigate, location.pathname]);

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    const fetchFriends = async () => {
      try {
        setLoadingFriends(true);
        const data = await friendApi.getFriends(currentUserId);
        if (!cancelled) {
          setFriends(data || []);
        }
      } catch {
        if (!cancelled) {
          setFriends([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingFriends(false);
        }
      }
    };

    fetchFriends();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const handleCreatePost = async ({ text, imageUrl }) => {
    try {
      const user =
        JSON.parse(localStorage.getItem("chatwave_user") || "null") || {};

      if (!user || (!user.username && !user.email)) {
        toast.error("Bạn cần đăng nhập để đăng bài.");
        return;
      }

      const newPost = await postApi.create({
        authorId: user.id || user._id,
        authorName: user.username || "User",
        authorSubtitle: "Thành viên ChatWave",
        text,
        imageUrl,
      });

      setPosts((prev) => [withLikeState(newPost), ...prev]);
      toast.success("Đăng bài thành công!");
    } catch (err) {
      toast.error(err?.message || "Không tạo được bài viết, vui lòng thử lại.");
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const user =
        JSON.parse(localStorage.getItem("chatwave_user") || "null") || {};

      if (!user || (!user.id && !user._id)) {
        toast.error("Bạn cần đăng nhập để yêu thích bài viết.");
        return;
      }

      const updated = await postApi.like(postId, user.id || user._id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === updated.id ? withLikeState({ ...p, ...updated }) : p
        )
      );
      setActivePost((prev) =>
        prev && prev.id === updated.id
          ? withLikeState({ ...prev, ...updated })
          : prev
      );
    } catch (err) {
      toast.error(err?.message || "Không thể yêu thích bài viết.");
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const user =
        JSON.parse(localStorage.getItem("chatwave_user") || "null") || {};

      if (!user || (!user.username && !user.email)) {
        toast.error("Bạn cần đăng nhập để bình luận.");
        return;
      }

      const updated = await postApi.addComment(postId, {
        author: user.username || "User",
        authorAvatar: user.avatar || null,
        text,
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === updated.id ? withLikeState({ ...p, ...updated }) : p
        )
      );
      setActivePost((prev) =>
        prev && prev.id === updated.id
          ? withLikeState({ ...prev, ...updated })
          : prev
      );
    } catch (err) {
      toast.error(err?.message || "Không thể thêm bình luận.");
    }
  };

  const handleShare = (postId) => {
    if (!currentUserId) {
      toast.error("Bạn cần đăng nhập để chia sẻ bài viết.");
      return;
    }
    setSharePostId(postId);
  };

  const selectedPost = useMemo(
    () => posts.find((p) => (p.id || p._id) === sharePostId) || null,
    [posts, sharePostId]
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

  const handleSendShareToFriend = async (friend) => {
    if (!selectedPost || !currentUserId) return;
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
      postId: selectedPost.id || selectedPost._id,
      preview: buildPostPreviewText(selectedPost),
      imageUrl: selectedPost.imageUrl || null,
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

      setPosts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === (selectedPost.id || selectedPost._id)
            ? { ...p, shares: (p.shares || 0) + 1 }
            : p
        )
      );
      setSharePostId(null);
      toast.success("Đã chia sẻ bài viết qua tin nhắn.");
    } catch (err) {
      toast.error(err?.message || "Không chia sẻ được bài viết.");
    } finally {
      setSendingShare(false);
    }
  };

  const handleEditPost = async (postId, { text, imageUrl }) => {
    try {
      const updated = await postApi.update(postId, { text, imageUrl });
      setPosts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === postId ? withLikeState({ ...p, ...updated }) : p
        )
      );
      setActivePost((prev) =>
        prev && (prev.id || prev._id) === postId ? withLikeState({ ...prev, ...updated }) : prev
      );
      toast.success("Đã cập nhật bài viết.");
    } catch (err) {
      toast.error(err?.message || "Không cập nhật được bài viết.");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Bạn có chắc muốn gỡ bài viết này?")) return;
    try {
      await postApi.remove(postId);
      setPosts((prev) =>
        prev.filter((p) => (p.id || p._id) !== postId)
      );
      setActivePost((prev) =>
        prev && (prev.id || prev._id) === postId ? null : prev
      );
      setIsModalOpen(false);
      toast.success("Đã gỡ bài viết.");
    } catch (err) {
      toast.error(err?.message || "Không gỡ được bài viết.");
    }
  };

  const handleOpenComments = (post) => {
    setActivePost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActivePost(null);
  };

  return (
    <MainLayout>
      {/* Nền tổng giống app social: xanh rất nhạt, card trắng */}
      <div className="min-h-[calc(100vh-80px)] w-full bg-[#F3F6FB] text-base md:text-[17px]">
        <div className="w-full px-3 md:px-6 py-4 md:py-6 grid grid-cols-1 lg:grid-cols-[5fr_8fr_5fr] gap-4 lg:gap-6 items-start">
          {/* Cột 1: menu nhỏ + Nhóm của tôi */}
          <aside className="hidden lg:flex flex-col gap-6 lg:sticky lg:top-4 self-start">
            <nav className="text-base text-gray-600">
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFEDD5] text-[#EA580C] font-semibold"
                  >
                    <span>Bảng tin</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white"
                  >
                    <span>Khám phá</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white"
                  >
                    <span>Nhóm</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white"
                  >
                    <span>Đã lưu</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white"
                  >
                    <span>Cài đặt</span>
                  </button>
                </li>
              </ul>
            </nav>

            <div>
              <p className="text-sm md:text-base font-semibold text-gray-700 tracking-wide mb-3">
                NHÓM CỦA TÔI
              </p>
              <div className="space-y-2 text-sm md:text-base">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FED7AA] text-xs md:text-sm font-semibold text-orange-700">
                    UX
                  </span>
                  <span className="text-gray-800">Cao thủ thiết kế</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#DBEAFE] text-xs md:text-sm font-semibold text-[#2563EB]">
                    AI
                  </span>
                  <span className="text-gray-800">Yêu thích AI</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Cột 2: tạo bài & feed */}
          <div className="flex-1 flex flex-col items-stretch gap-4">
            <HomeCreatePost onCreatePost={handleCreatePost} />

            {error && (
              <div className="w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="w-full flex flex-col gap-4 pb-6">
              {loading ? (
                <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-6 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#4F8EF7] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">
                    Đang tải bài viết...
                  </p>
                </div>
              ) : posts.length === 0 ? (
                <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-6 text-center space-y-2">
                  <p className="text-sm md:text-base font-medium text-gray-700">
                    Chưa có bài viết nào trong ngày hôm nay
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    Hãy là người đầu tiên chia sẻ cảm xúc cùng mọi người nhé!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <HomePostCard
                    key={post.id || post._id}
                    post={post}
                    onToggleLike={handleToggleLike}
                    onAddComment={handleAddComment}
                    onShare={handleShare}
                    onDelete={handleDeletePost}
                    onEdit={handleEditPost}
                    onOpenComments={handleOpenComments}
                  />
                ))
              )}
            </div>
          </div>

          {/* Cột 3: Chủ đề nổi bật + Nhóm gợi ý */}
          <aside className="hidden lg:flex lg:flex-col gap-4 lg:sticky lg:top-4 self-start">
            <div className="rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-gray-900">
                  Chủ đề đang nổi
                </p>
                <span className="text-xs text-[#EA580C] font-medium cursor-default">
                  Hôm nay
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Công nghệ</p>
                  <p className="font-semibold text-gray-900">
                    #TriTueNhanTao
                  </p>
                  <p className="text-gray-400 text-xs md:text-sm">42.5K lượt quan tâm</p>
                </div>
                <div>
                  <p className="text-gray-500">Thiết kế UI/UX</p>
                  <p className="font-semibold text-gray-900">#ThietKeWeb2024</p>
                  <p className="text-gray-400 text-xs md:text-sm">18.2K lượt quan tâm</p>
                </div>
                <div>
                  <p className="text-gray-500">Năng suất làm việc</p>
                  <p className="font-semibold text-gray-900">#LamViecTuXa</p>
                  <p className="text-gray-400 text-xs md:text-sm">12.8K lượt quan tâm</p>
                </div>
              </div>

              <button
                type="button"
                className="mt-1 text-xs font-medium text-[#EA580C] hover:text-[#C2410C]"
              >
                Xem thêm
              </button>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-4 py-4 space-y-3">
              <p className="text-base font-semibold text-gray-900">
                Nhóm gợi ý cho bạn
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Họa sĩ ý tưởng
                    </p>
                    <p className="text-gray-400 text-xs md:text-sm">8.4k thành viên</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full border border-[#FB923C] text-[11px] font-medium text-[#EA580C] hover:bg-orange-50"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">Code Review</p>
                    <p className="text-gray-400 text-xs md:text-sm">12.1k thành viên</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full border border-[#FB923C] text-[11px] font-medium text-[#EA580C] hover:bg-orange-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </aside>
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
                  onClick={handleCloseModal}
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
                  onEdit={handleEditPost}
                  onOpenComments={() => {}}
                  showAllComments
                />
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
                {selectedPost && (
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 line-clamp-3">
                    {buildPostPreviewText(selectedPost)}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {loadingFriends ? (
                  <p className="text-xs text-gray-500">
                    Đang tải danh sách bạn bè...
                  </p>
                ) : friends.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Bạn chưa có bạn bè nào để chia sẻ. Hãy kết bạn trước nhé.
                  </p>
                ) : (
                  friends.map((f) => {
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
      </div>
    </MainLayout>
  );
}

