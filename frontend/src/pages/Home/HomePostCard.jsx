import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Pencil } from "lucide-react";
import { uploadApi } from "../../api/uploadApi";

export default function HomePostCard({
  post,
  onToggleLike,
  onAddComment,
  onShare,
  onDelete,
  onEdit,
  onOpenComments,
  onVotePoll,
  showAllComments = false,
  onToggleSave,
  isSaved = false,
}) {
  const [commentText, setCommentText] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editText, setEditText] = useState(post.text || "");
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl || "");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menuOpen) return;
    const fn = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [menuOpen]);

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

  const currentUserId = currentUser?.id || currentUser?._id;
  const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
  const hasLiked =
    typeof post.isLiked === "boolean"
      ? post.isLiked
      : !!(
          currentUserId &&
          likedBy.map(String).includes(String(currentUserId))
        );
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

  const saveLabel = isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết";

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
    if (typeof onAddComment === "function") {
      onAddComment(postId, trimmed);
    }
    setCommentText("");
  };

  const authorAvatar = post.authorAvatar || post.avatar || null;
  const initial = (post.authorName || "U").charAt(0).toUpperCase();

  const handleSaveEdit = async () => {
    if (typeof onEdit !== "function") return;
    if (!editText.trim() && !editImageUrl && !editImageFile) return;
    setSaving(true);
    try {
      let finalImageUrl = editImageUrl || null;
      if (editImageFile) {
        const data = await uploadApi.uploadImage(editImageFile);
        finalImageUrl = data?.url || null;
      }
      await onEdit(post.id || post._id, {
        text: editText.trim(),
        imageUrl: finalImageUrl,
      });
      setShowEdit(false);
      setEditImageFile(null);
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
        setEditImagePreview(null);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="w-full bg-white rounded-2xl shadow-sm border border-[#E2E8F0] px-4 py-4 md:px-5 md:py-5 relative">
      {/* Header */}
      <header className="flex items-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => {
            const authorId = post.authorId || post.author;
            if (authorId) navigate(`/profile/${authorId}`);
          }}
          className="flex items-center gap-3 text-left flex-1"
        >
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden bg-[#FA8DAE]/20 flex items-center justify-center text-sm md:text-base font-semibold text-[#FA8DAE] shrink-0">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={post.authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
              {post.authorName}
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              {post.authorSubtitle}
              {post.feeling && ` · ${post.feeling}`}
              {" · "}
              {formatPostTime()}
            </p>
          </div>
        </button>
        {(onDelete || (onEdit && isAuthor) || onToggleSave) && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="text-gray-400 hover:text-gray-600 text-2xl px-2"
              aria-label="Tùy chọn"
            >
              •••
            </button>
            {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[190px]">
              {typeof onEdit === "function" && isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditText(post.text || "");
                    setEditImageUrl(post.imageUrl || "");
                    setShowEdit(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <Pencil className="w-4 h-4" /> Sửa bài viết
                </button>
              )}
              {typeof onDelete === "function" && isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(post.id || post._id);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 whitespace-nowrap"
                >
                  Gỡ bài viết
                </button>
              )}
              {typeof onToggleSave === "function" && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleSave(post);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 whitespace-nowrap"
                >
                  {saveLabel}
                </button>
              )}
            </div>
            )}
          </div>
        )}
      </header>

      {showEdit && (
        <div className="absolute inset-0 bg-white rounded-2xl z-10 p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Sửa bài viết</h3>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="Nội dung..."
          />
          <div className="flex items-center justify-between gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) return;
                if (editImagePreview) URL.revokeObjectURL(editImagePreview);
                setEditImageFile(file);
                setEditImagePreview(URL.createObjectURL(file));
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Chọn ảnh
            </button>
            {(editImageUrl || editImageFile) && (
              <button
                type="button"
                onClick={() => {
                  setEditImageUrl("");
                  if (editImagePreview) URL.revokeObjectURL(editImagePreview);
                  setEditImageFile(null);
                  setEditImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Xóa ảnh
              </button>
            )}
          </div>
          {(editImagePreview || editImageUrl) && (
            <div className="mt-1 rounded-xl overflow-hidden border border-gray-200 max-h-48">
              <img
                src={editImagePreview || editImageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex gap-2 mt-auto">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-3 py-1.5 bg-[#FA8DAE] text-white rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEdit(false);
                if (editImagePreview) {
                  URL.revokeObjectURL(editImagePreview);
                  setEditImagePreview(null);
                  setEditImageFile(null);
                }
                setEditImageUrl(post.imageUrl || "");
                setEditText(post.text || "");
              }}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        {post.text ? (
          <p className="text-sm md:text-base text-gray-800 leading-relaxed">
            {post.text}
          </p>
        ) : (
          // Fallback khi không có text
          <>
            {post.feeling && (
              <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                Đang cảm thấy {post.feeling}.
              </p>
            )}
            {!post.feeling && post.poll && post.poll.question && (
              <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                Khảo sát: {post.poll.question}
              </p>
            )}
            {!post.feeling &&
              !post.poll &&
              post.scheduledAt && (
                <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                  Bài viết này được đăng theo lịch.
                </p>
              )}
          </>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-medium text-[#FA8DAE] hover:underline cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
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
          onClick={() =>
            !isGuest &&
            typeof onToggleLike === "function" &&
            onToggleLike(post.id || post._id)
          }
          title={likedTooltip}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-orange-50 ${
            hasLiked ? "text-[#EA580C]" : "text-gray-600"
          } ${
            isGuest || typeof onToggleLike !== "function"
              ? "opacity-60 cursor-not-allowed"
              : ""
          }`}
          disabled={isGuest || typeof onToggleLike !== "function"}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? "fill-[#EA580C] text-[#EA580C]" : ""}`} />
          <span>{(post.likes || 0).toLocaleString("vi-VN")}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            !isGuest &&
            typeof onOpenComments === "function" &&
            onOpenComments(post)
          }
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[#F1F5F9] text-gray-600 ${
            isGuest || typeof onOpenComments !== "function"
              ? "opacity-60 cursor-not-allowed"
              : ""
          }`}
          disabled={isGuest || typeof onOpenComments !== "function"}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{(post.comments || 0).toLocaleString("vi-VN")}</span>
        </button>

        {typeof onShare === "function" && (
          <button
            type="button"
            onClick={() =>
              !isGuest &&
              typeof onShare === "function" &&
              onShare(post.id || post._id)
            }
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[#F1F5F9] text-gray-600 ${
              isGuest || typeof onShare !== "function"
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
            disabled={isGuest || typeof onShare !== "function"}
          >
            <Share2 className="w-5 h-5" />
            <span>Chia sẻ</span>
          </button>
        )}
      </div>

      {/* Comments */}
      <div className="mt-3 space-y-2">
        {(showAllComments ? post.commentList || [] : post.commentList?.slice(0, 2) || []).map((cmt, index) => (
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

      {/* Poll (khảo sát) */}
      {post.poll && post.poll.question && Array.isArray(post.poll.options) && post.poll.options.length > 0 && (
        <div className="mt-3 border-t border-dashed border-gray-200 pt-3 space-y-2">
          <p className="text-sm font-semibold text-gray-800">{post.poll.question}</p>
          <div className="space-y-1">
            {post.poll.options.map((opt, idx) => {
              const votedBy = opt.votedBy || [];
              const isVoted = currentUserId && votedBy.includes(String(currentUserId));
              return (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  typeof onVotePoll === "function" &&
                  onVotePoll(post.id || post._id, idx)
                }
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full border text-xs md:text-sm hover:bg-[#FFF7F0] ${
                  isVoted ? "border-[#FA8DAE] bg-[#FFF7F0] text-[#FA8DAE] font-medium" : "border-gray-200 text-gray-700"
                }`}
              >
                <span className="truncate">{opt.text}</span>
                <span className={`ml-2 text-[11px] ${isVoted ? "text-[#FA8DAE]" : "text-gray-500"}`}>
                  {opt.votes || votedBy.length || 0} phiếu
                </span>
              </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

