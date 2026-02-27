import React, { useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";

export default function HomePostCard({
  post,
  onToggleLike,
  onAddComment,
  onShare,
}) {
  const [commentText, setCommentText] = useState("");

  const handleSubmitComment = (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(post.id, trimmed);
    setCommentText("");
  };

  const initial = post.authorName.charAt(0).toUpperCase();

  return (
    <article className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm px-4 py-4 md:px-5 md:py-5">
      {/* Header */}
      <header className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FA8DAE]/20 flex items-center justify-center text-sm md:text-base font-semibold text-[#FA8DAE]">
          {initial}
        </div>
        <div className="flex-1">
          <p className="text-sm md:text-base font-semibold text-gray-900">
            {post.authorName}
          </p>
          <p className="text-[11px] md:text-xs text-gray-500">
            {post.authorSubtitle} · {post.timeAgo}
          </p>
        </div>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 text-lg"
          aria-label="Tùy chọn"
        >
          •••
        </button>
      </header>

      {/* Content */}
      <div className="space-y-3">
        {post.text && (
          <p className="text-sm md:text-base text-gray-800">{post.text}</p>
        )}

        {post.imageUrl && (
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <img
              src={post.imageUrl}
              alt=""
              className="w-full max-h-[420px] object-cover"
            />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center justify-between text-[11px] md:text-xs text-gray-500">
        <span>{post.likes.toLocaleString("vi-VN")} lượt thích</span>
        <div className="flex items-center gap-3">
          <span>{post.comments} bình luận</span>
          <span>{post.shares} lượt chia sẻ</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 border-t border-gray-100 pt-2 flex items-center justify-between text-xs md:text-sm">
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 ${
            post.isLiked ? "text-[#FA8DAE]" : "text-gray-600"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              post.isLiked ? "fill-[#FA8DAE] text-[#FA8DAE]" : ""
            }`}
          />
          <span>Yêu thích</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 text-gray-600"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Bình luận</span>
        </button>

        <button
          type="button"
          onClick={() => onShare(post.id)}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 text-gray-600"
        >
          <Share2 className="w-4 h-4" />
          <span>Chia sẻ</span>
        </button>
      </div>

      {/* Comments */}
      <div className="mt-3 space-y-2">
        {post.commentList?.slice(0, 3).map((cmt) => (
          <div key={cmt.id} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-[#6CB8FF]/20 flex items-center justify-center text-[11px] font-semibold text-[#6CB8FF]">
              {cmt.author.charAt(0)}
            </div>
            <div className="bg-gray-100 rounded-2xl px-3 py-1.5 flex-1">
              <p className="text-xs font-semibold text-gray-800">
                {cmt.author}
              </p>
              <p className="text-xs text-gray-700">{cmt.text}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{cmt.timeAgo}</p>
            </div>
          </div>
        ))}

        <form
          onSubmit={handleSubmitComment}
          className="flex items-center gap-2 mt-2"
        >
          <div className="w-7 h-7 rounded-full bg-[#FA8DAE]/20 flex items-center justify-center text-[11px] font-semibold text-[#FA8DAE]">
            U
          </div>
          <input
            type="text"
            placeholder="Viết bình luận..."
            className="flex-1 text-xs md:text-sm border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </form>
      </div>
    </article>
  );
}

