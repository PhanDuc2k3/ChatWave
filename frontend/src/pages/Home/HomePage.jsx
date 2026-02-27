import React, { useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { initialPosts } from "./homeData";
import HomeCreatePost from "./HomeCreatePost";
import HomePostCard from "./HomePostCard";

export default function HomePage() {
  const [posts, setPosts] = useState(initialPosts);

  const handleCreatePost = ({ text, imageUrl }) => {
    const newPost = {
      id: Date.now(),
      authorName: "User",
      authorSubtitle: "Thành viên ChatWave",
      timeAgo: "Vừa xong",
      text,
      imageUrl,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      commentList: [],
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const handleToggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isLiked = !p.isLiked;
        const likes = isLiked ? p.likes + 1 : Math.max(p.likes - 1, 0);
        return { ...p, isLiked, likes };
      })
    );
  };

  const handleAddComment = (postId, text) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const newComment = {
          id: Date.now(),
          author: "User",
          text,
          timeAgo: "Vừa xong",
        };
        return {
          ...p,
          commentList: [newComment, ...(p.commentList || [])],
          comments: p.comments + 1,
        };
      })
    );
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

        <div className="w-full flex flex-col gap-4">
          {posts.map((post) => (
            <HomePostCard
              key={post.id}
              post={post}
              onToggleLike={handleToggleLike}
              onAddComment={handleAddComment}
              onShare={handleShare}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

