import React, { useMemo, useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";

export default function HomePostCard({
  post,
  onToggleLike,
  onAddComment,
  onShare,
  onDelete,
  onOpenComments,
  showAllComments = false,
}) {
  const [commentText, setCommentText] = useState("");

  const currentUserInitial = useMemo(() => {
    try {
      const raw = localStorage.getItem("chatwave_user");
      if (!raw) return "U";
      const user = JSON.parse(raw);
      const name = user.username || user.email || user.name || "User";
      return name.charAt(0).toUpperCase();
    } catch {
      return "U";
    }
  }, []);

  const hasLiked = !!post.isLiked;

  const likedTooltip = useMemo(() => {
    const total = post.likes || 0;
    if (!total) return "Chưa có ai yêu thích";

    if (!hasLiked) {
      return `${total} người đã yêu thích`;
    }

    if (total === 1) return "Bạn đã yêu thích";
    return `Bạn và ${total - 1} người khác đã yêu thích`;
  }, [post.likes, hasLiked]);

  const formatPostTime = () => {
    if (post.timeAgo) return post.timeAgo;
    if (!post.createdAt) return "";
    const created = new Date(post.createdAt).getTime();
    const diffSec = Math.max(1, Math.floor((Date.now() - created) / 1000));
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ngày trước`;
  };

  const formatTimeAgo = (cmt) => {
    if (cmt.timeAgo) return cmt.timeAgo;
    if (!cmt.createdAt) return "";
    const created = new Date(cmt.createdAt).getTime();
    const diffMs = Date.now() - created;
    const diffSec = Math.max(1, Math.floor(diffMs / 1000));
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ngày trước`;
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    const postId = post.id || post._id;
    if (!postId) return;
    onAddComment(postId, trimmed);
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
            {post.authorSubtitle} · {formatPostTime()}
          </p>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(post.id || post._id)}
            className="text-gray-400 hover:text-gray-600 text-lg px-2"
            aria-label="Gỡ bài viết"
          >
            •••
          </button>
        )}
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
          onClick={() => onToggleLike(post.id || post._id)}
          title={likedTooltip}
          className={`flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 ${hasLiked ? "text-[#FA8DAE]" : "text-gray-600"
            }`}
        >
          <Heart
            className={`w-4 h-4 ${hasLiked ? "fill-[#FA8DAE] text-[#FA8DAE]" : ""
              }`}
          />
          <span>Yêu thích</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenComments && onOpenComments(post)}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 text-gray-600"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Bình luận</span>
        </button>

        <button
          type="button"
          onClick={() => onShare(post.id || post._id)}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 text-gray-600"
        >
          <Share2 className="w-4 h-4" />
          <span>Chia sẻ</span>
        </button>
      </div>

      {/* Comments */}
      <div className="mt-3 space-y-2">
        {(showAllComments ? post.commentList || [] : post.commentList?.slice(0, 3) || []).map((cmt, index) => (
          <div key={cmt.id || cmt._id || index} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-[#6CB8FF]/20 flex items-center justify-center text-[11px] font-semibold text-[#6CB8FF]">
              {cmt.author.charAt(0)}
            </div>
            <div className="bg-gray-100 rounded-2xl px-3 py-1.5 flex-1">
              <p className="text-xs font-semibold text-gray-800">
                {cmt.author}
              </p>
              <p className="text-xs text-gray-700">{cmt.text}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {formatTimeAgo(cmt)}
              </p>
            </div>
          </div>
        ))}

        <form
          onSubmit={handleSubmitComment}
          className="flex items-center gap-2 mt-2"
        >
          <div className="w-7 h-7 rounded-full bg-[#FA8DAE]/20 flex items-center justify-center text-[11px] font-semibold text-[#FA8DAE]">
            {currentUserInitial}
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

