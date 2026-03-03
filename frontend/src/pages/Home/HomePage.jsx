import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import HomeCreatePost from "./HomeCreatePost";
import HomePostCard from "./HomePostCard";
import { postApi } from "../../api/postApi";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await postApi.getAll();
        if (isMounted) {
          setPosts(data || []);
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

      const newPost = await postApi.create({
        authorName: user.username || "User",
        authorSubtitle: "Thành viên ChatWave",
        text,
        imageUrl,
      });

      setPosts((prev) => [newPost, ...prev]);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.message || "Không tạo được bài viết, vui lòng thử lại.");
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const updated = await postApi.like(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.message || "Không thể like bài viết.");
    }
  };

  const handleAddComment = async (postId, text) => {
    try {
      const user =
        JSON.parse(localStorage.getItem("chatwave_user") || "null") || {};

      const updated = await postApi.addComment(postId, {
        author: user.username || "User",
        text,
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err?.message || "Không thể thêm bình luận.");
    }
  };

  const handleShare = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, shares: p.shares + 1 } : p
      )
    );
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
              />
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}

