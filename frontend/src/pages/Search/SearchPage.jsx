import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, User, UsersRound, FileText } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { userApi } from "../../api/userApi";
import { groupApi } from "../../api/groupApi";
import { postApi } from "../../api/postApi";
import HomePostCard from "../Home/HomePostCard";
import toast from "react-hot-toast";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qFromUrl = searchParams.get("q") || "";
  const [query, setQuery] = useState(qFromUrl);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    groups: [],
    posts: [],
  });
  const [searched, setSearched] = useState(false);

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    } catch {
      return null;
    }
  }, []);
  const currentUserId = currentUser?.id || currentUser?._id;

  const withLikeState = (post) => {
    const likedBy = post.likedBy || [];
    const isLiked = currentUserId ? likedBy.includes(currentUserId) : false;
    return { ...post, isLiked };
  };

  const handleSearch = async (e) => {
    e?.preventDefault?.();
    const q = query.trim();
    if (!q) {
      toast.error("Nhập từ khóa tìm kiếm.");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const [usersRes, groupsRes, postsRes] = await Promise.all([
        userApi.search(q),
        groupApi.search(q),
        postApi.search(q),
      ]);
      setResults({
        users: usersRes || [],
        groups: groupsRes || [],
        posts: (postsRes || []).map(withLikeState),
      });
    } catch (err) {
      toast.error(err?.message || "Tìm kiếm thất bại.");
      setResults({ users: [], groups: [], posts: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!currentUserId) return;
    try {
      const post = results.posts.find((p) => (p.id || p._id) === postId);
      if (!post) return;
      const updated = await postApi.like(postId, currentUserId);
      setResults((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          (p.id || p._id) === postId ? withLikeState({ ...p, ...updated }) : p
        ),
      }));
    } catch (err) {
      toast.error(err?.message || "Không thể yêu thích.");
    }
  };

  const handleAddComment = async (postId, text) => {
    if (!currentUserId) return;
    try {
      const user =
        JSON.parse(localStorage.getItem("chatwave_user") || "null") || {};
      const updated = await postApi.addComment(postId, {
        author: user.username || "User",
        authorAvatar: user.avatar || null,
        text,
      });
      setResults((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          (p.id || p._id) === postId ? withLikeState({ ...p, ...updated }) : p
        ),
      }));
    } catch (err) {
      toast.error(err?.message || "Không thể thêm bình luận.");
    }
  };

    useEffect(() => {
    if (qFromUrl && qFromUrl.trim()) {
      setQuery(qFromUrl);
    }
  }, [qFromUrl]);

  useEffect(() => {
    const q = (qFromUrl || "").trim();
    if (!q) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setSearched(true);
      try {
        const [usersRes, groupsRes, postsRes] = await Promise.all([
          userApi.search(q),
          groupApi.search(q),
          postApi.search(q),
        ]);
        if (cancelled) return;
        setResults({
          users: usersRes || [],
          groups: groupsRes || [],
          posts: (postsRes || []).map(withLikeState),
        });
      } catch (err) {
        if (cancelled) return;
        toast.error(err?.message || "Tìm kiếm thất bại.");
        setResults({ users: [], groups: [], posts: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [qFromUrl]);

  const handleShare = (postId) => {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        (p.id || p._id) === postId ? { ...p, shares: (p.shares || 0) + 1 } : p
      ),
    }));
  };

  const handleDeletePost = () => {
    // Search results - usually don't allow delete here
  };

  const handleEditPost = async () => {
    // Search results - refresh after edit
  };

  const empty = !results.users?.length && !results.groups?.length && !results.posts?.length;

  return (
    <MainLayout showSearch={false}>
      <div className="w-full max-w-2xl mx-auto py-4 md:py-6">
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 px-4 py-3"
        >
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhóm, bài viết, người dùng..."
            className="flex-1 outline-none text-sm md:text-base bg-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-full bg-[#FA8DAE] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
          >
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Đang tìm kiếm...</p>
        ) : searched && empty ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Search className="w-12 h-12 text-gray-300 mb-3 mx-auto" />
            <p className="text-gray-500">Không tìm thấy kết quả phù hợp.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Người dùng */}
            {results.users?.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                  <User className="w-5 h-5 text-[#FA8DAE]" />
                  Người dùng ({results.users.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {results.users.map((user) => {
                    const name = user.username || user.email || "User";
                    const initial = name.charAt(0);
                    return (
                      <button
                        key={user.id || user._id}
                        type="button"
                        onClick={() => navigate(`/profile/${user.id || user._id}`)}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 text-left hover:shadow-md hover:border-[#FA8DAE]/40 transition"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#FA8DAE]/20 flex items-center justify-center mx-auto mb-2">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-[#FA8DAE]">
                              {initial}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 truncate text-sm">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Nhóm */}
            {results.groups?.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                  <UsersRound className="w-5 h-5 text-[#6CB8FF]" />
                  Nhóm ({results.groups.length})
                </h2>
                <div className="space-y-2">
                  {results.groups.map((g) => (
                    <button
                      key={g.id || g._id}
                      type="button"
                      onClick={() => navigate(`/groups/${g.id || g._id}`)}
                      className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-4 text-left hover:shadow-md hover:border-[#6CB8FF]/40 transition flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#6CB8FF]/20 flex items-center justify-center shrink-0">
                        <UsersRound className="w-6 h-6 text-[#6CB8FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {g.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {g.description || "Không có mô tả"} ·{" "}
                          {(g.members || []).length} thành viên
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Bài viết */}
            {results.posts?.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                  <FileText className="w-5 h-5 text-[#F5C46A]" />
                  Bài viết ({results.posts.length})
                </h2>
                <div className="space-y-4">
                  {results.posts.map((post) => (
                    <HomePostCard
                      key={post.id || post._id}
                      post={post}
                      onToggleLike={handleToggleLike}
                      onAddComment={handleAddComment}
                      onShare={handleShare}
                      onDelete={handleDeletePost}
                      onEdit={handleEditPost}
                      showAllComments
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
