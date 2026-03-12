import React, { useMemo, useState } from "react";
import { Heart, MessageCircle, Share2, Pencil } from "lucide-react";

export default function HomePostCard({
  post,
  onToggleLike,
  onAddComment,
  onShare,
  onDelete,
  onEdit,
  onOpenComments,
  showAllComments = false,
}) {
  const [commentText, setCommentText] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editText, setEditText] = useState(post.text || "");
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl || "");
  const [saving, setSaving] = useState(false);

  const isAuthor = useMemo(() => {
    try {
      const raw = localStorage.getItem("chatwave_user");
      if (!raw) return false;
      const u = JSON.parse(raw);
      const uid = u?.id || u?._id;
      const postAuthorId = post.authorId || post.author;
      return uid && postAuthorId && String(uid) === String(postAuthorId);
    } catch {
      return false;
    }
  }, [post.authorId, post.author]);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("chatwave_user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);
  const currentUserInitial =
    currentUser?.username || currentUser?.email || currentUser?.name
      ? String(
          currentUser.username || currentUser.email || currentUser.name
        )
          .charAt(0)
          .toUpperCase()
      : "U";

  const hasLiked = !!post.isLiked;
  const isGuest = !currentUser;

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

  const handleSaveEdit = async () => {
    if (!onEdit) return;
    if (!editText.trim() && !editImageUrl.trim()) return;
    setSaving(true);
    try {
      await onEdit(post.id || post._id, { text: editText.trim(), imageUrl: editImageUrl || null });
      setShowEdit(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="w-full bg-white rounded-2xl shadow-sm border border-[#E2E8F0] px-4 py-4 md:px-5 md:py-5 relative">
      {/* Header */}
      <header className="flex items-center gap-4 mb-4">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#FA8DAE]/20 flex items-center justify-center text-sm md:text-base font-semibold text-[#FA8DAE]">
          {initial}
        </div>
        <div className="flex-1">
          <p className="text-sm md:text-base font-semibold text-gray-900">
            {post.authorName}
          </p>
          <p className="text-xs md:text-sm text-gray-500">
            {post.authorSubtitle} · {formatPostTime()}
          </p>
        </div>
        {(onDelete || (onEdit && isAuthor)) && (
          <div className="relative group">
            <button type="button" className="text-gray-400 hover:text-gray-600 text-2xl px-2" aria-label="Tùy chọn">
              •••
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
              {onEdit && isAuthor && (
                <button type="button" onClick={() => { setEditText(post.text || ""); setEditImageUrl(post.imageUrl || ""); setShowEdit(true); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Sửa bài viết
                </button>
              )}
              {onDelete && isAuthor && (
                <button type="button" onClick={() => onDelete(post.id || post._id)} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                  Gỡ bài viết
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {showEdit && (
        <div className="absolute inset-0 bg-white rounded-2xl z-10 p-4 flex flex-col">
          <h3 className="text-sm font-semibold mb-3">Sửa bài viết</h3>
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm mb-3 resize-none" placeholder="Nội dung..." />
          <input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-3" placeholder="URL ảnh (để trống nếu không đổi)" />
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-3 py-1.5 bg-[#FA8DAE] text-white rounded-lg text-sm font-medium">Lưu</button>
            <button type="button" onClick={() => setShowEdit(false)} className="px-3 py-1.5 border rounded-lg text-sm">Hủy</button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        {post.text && (
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            {post.text}
          </p>
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

      {/* Bottom actions row giống thanh dưới trong ảnh */}
      <div className="mt-5 border-t border-gray-100 pt-3 flex items-center justify-between text-xs md:text-sm text-gray-500">
        <button
          type="button"
          onClick={() => !isGuest && onToggleLike(post.id || post._id)}
          title={likedTooltip}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-orange-50 ${
            hasLiked ? "text-[#EA580C]" : "text-gray-600"
          } ${isGuest ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={isGuest}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? "fill-[#EA580C] text-[#EA580C]" : ""}`} />
          <span>{(post.likes || 0).toLocaleString("vi-VN")}</span>
        </button>

        <button
          type="button"
          onClick={() => !isGuest && onOpenComments && onOpenComments(post)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[#F1F5F9] text-gray-600 ${
            isGuest ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={isGuest}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{(post.comments || 0).toLocaleString("vi-VN")}</span>
        </button>

        <button
          type="button"
          onClick={() => !isGuest && onShare(post.id || post._id)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[#F1F5F9] text-gray-600 ${
            isGuest ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={isGuest}
        >
          <Share2 className="w-5 h-5" />
          <span>Chia sẻ</span>
        </button>
      </div>

      {/* Comments */}
      <div className="mt-3 space-y-2">
        {(showAllComments ? post.commentList || [] : post.commentList?.slice(0, 3) || []).map((cmt, index) => (
          <div key={cmt.id || cmt._id || index} className="flex gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#6CB8FF]/20 flex items-center justify-center text-[11px] font-semibold text-[#6CB8FF] shrink-0">
              {cmt.authorAvatar ? (
                <img src={cmt.authorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                cmt.author.charAt(0)
              )}
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

        {!isGuest && (
          <form
            onSubmit={handleSubmitComment}
            className="flex items-center gap-2 mt-2"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#4F8EF7]/20 flex items-center justify-center text-[11px] font-semibold text-[#4F8EF7] shrink-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUserInitial
              )}
            </div>
            <input
              type="text"
              placeholder="Viết bình luận..."
              className="flex-1 text-xs md:text-sm border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
          </form>
        )}
      </div>
    </article>
  );
}

