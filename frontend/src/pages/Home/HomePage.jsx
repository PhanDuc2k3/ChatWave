import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import MainLayout from "../../layouts/MainLayout";
import HomeCreatePost from "./HomeCreatePost";
import HomePostCard from "./HomePostCard";
import { postApi } from "../../api/postApi";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePost, setActivePost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const storedUser =
    JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  const currentUserId = storedUser?.id || storedUser?._id || null;

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
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, shares: p.shares + 1 } : p
      )
    );
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

  const headerContent = null;

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full flex flex-col items-center py-4 md:py-6 space-y-4">
        <HomeCreatePost onCreatePost={handleCreatePost} />

        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="w-full flex flex-col gap-4">
          {loading ? (
            <p className="text-center text-sm text-gray-500">
              Đang tải bài viết...
            </p>
          ) : (
            posts.map((post) => (
              <HomePostCard
                key={post.id}
                post={post}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
                onShare={handleShare}
                onDelete={handleDeletePost}
                onOpenComments={handleOpenComments}
              />
            ))
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
                  onOpenComments={() => {}}
                  showAllComments
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

