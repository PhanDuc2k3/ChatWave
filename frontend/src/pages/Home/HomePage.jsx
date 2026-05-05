import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Users, Sparkles, ChevronLeft, Lock, Globe, Calendar, UserPlus, Image, Settings, Bell, Search, MoreHorizontal } from "lucide-react";
import { useConfirm } from "../../context/ConfirmContext";
import MainLayout from "../../layouts/MainLayout";
import HomeCreatePost from "./HomeCreatePost";
import HomePostCard from "./HomePostCard";
import { postApi } from "../../api/postApi";
import { friendApi } from "../../api/friendApi";
import { messageApi } from "../../api/messageApi";
import { groupApi } from "../../api/groupApi";

export default function HomePage() {
  const { confirm } = useConfirm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const scrollPositionRef = useRef(0);
  const [error, setError] = useState("");
  const [activePost, setActivePost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sendingShare, setSendingShare] = useState(false);
  const [activeSection, setActiveSection] = useState("all"); // "all" | "feed" | "explore" | "groups" | "saved"
  const [exploreQuery, setExploreQuery] = useState("");
  const [exploreResults, setExploreResults] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState("");
  const [myGroups, setMyGroups] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [activeGroup, setActiveGroup] = useState(null);
  const activeGroupInfo = myGroups.find(g => String(g.id || g._id) === String(activeGroup)) || null;
  const [groupPosts, setGroupPosts] = useState([]);
  const [loadingGroupPosts, setLoadingGroupPosts] = useState(false);
  const [groupDetailTab, setGroupDetailTab] = useState("posts"); // "posts" | "members" | "about"
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem("chatwave_saved_posts");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const location = useLocation();
  const navigate = useNavigate();

  const storedUser =
    JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  const currentUserId = storedUser?.id || storedUser?._id || null;
  const currentUserName =
    storedUser?.username || storedUser?.email || storedUser?.name || "Bạn";

  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const withLikeState = useCallback(
    (post) => {
      const likedBy = post.likedBy || [];
      const isLiked = currentUserIdRef.current ? likedBy.includes(currentUserIdRef.current) : false;
      return { ...post, isLiked };
    },
    []
  );

  const exploreList = useMemo(() => {
    if (exploreQuery.trim()) {
      return (exploreResults || []).map(withLikeState);
    }
    return [...posts].sort(
      (a, b) => (b.likes || 0) - (a.likes || 0)
    );
  }, [exploreQuery, exploreResults, posts]);

  const savedIdSet = useMemo(
    () => new Set((savedIds || []).map((id) => String(id))),
    [savedIds]
  );

  const savedPosts = useMemo(
    () => {
      const combined = [...(posts || []), ...(groupPosts || [])];
      const seen = new Set();
      return combined.filter((p) => {
        const id = String(p.id || p._id);
        if (!savedIdSet.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    },
    [posts, groupPosts, savedIdSet]
  );

  const hotTopics = useMemo(() => {
    const source = posts || [];
    const tagCount = new Map();

    source.forEach((p) => {
      const savedHashtags = Array.isArray(p.hashtags) ? p.hashtags : [];
      savedHashtags.forEach((tag) => {
        const key = String(tag).toLowerCase();
        if (key.length >= 2 && key.length <= 40) {
          tagCount.set(key, (tagCount.get(key) || 0) + 2);
        }
      });

      const text = String(p.text || "");
      if (text) {
        const matches = text.match(/#[^\s#]+/g);
        if (matches) {
          matches.forEach((raw) => {
            const tag = raw.trim();
            if (tag.length < 2 || tag.length > 40) return;
            const key = tag.toLowerCase();
            tagCount.set(key, (tagCount.get(key) || 0) + 1);
          });
        }
      }
    });

    if (!tagCount.size) return [];

    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
  }, [posts]);

  const shuffledPosts = useMemo(() => {
    const arr = [...(posts || [])];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [posts]);

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await postApi.getAll({ page: 1, limit: 5 });
        if (isMounted) {
          const newPosts = data?.posts || data || [];
          setPosts(newPosts.map(withLikeState));
          setHasMore(data?.pagination?.hasMore ?? false);
          pageRef.current = 1;
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

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = pageRef.current + 1;
      const data = await postApi.getAll({ page: nextPage, limit: 5 });
      const newPosts = data?.posts || [];
      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts.map(withLikeState)]);
        pageRef.current = nextPage;
        setHasMore(data?.pagination?.hasMore ?? (newPosts.length === 5));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, withLikeState]);

  useEffect(() => {
    const sentinel = document.getElementById("scroll-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMorePosts]);

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

  useEffect(() => {
    if (!currentUserId) {
      setMyGroups([]);
      return;
    }
    let cancelled = false;
    const fetchMyGroups = async () => {
      try {
        const data = await groupApi.getMyGroups(currentUserId);
        if (!cancelled) {
          const groups = Array.isArray(data) ? data : (data?.data || data?.groups || []);
          setMyGroups(groups);
        }
      } catch {
        if (!cancelled) {
          setMyGroups([]);
        }
      }
    };
    fetchMyGroups();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const handleExploreSearch = async (e) => {
    e.preventDefault();
    const q = exploreQuery.trim();
    if (!q) return;
    try {
      setExploreLoading(true);
      setExploreError("");
      const data = await postApi.search(q);
      setExploreResults(data || []);
    } catch (err) {
      setExploreError(err?.message || "Không tìm được bài viết phù hợp.");
    } finally {
      setExploreLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    const fetchGroups = async () => {
      try {
        const [mine, discover] = await Promise.all([
          groupApi.getMyGroups(currentUserId),
          groupApi.getDiscoverable(currentUserId),
        ]);
        if (cancelled) return;
        const myList = mine || [];
        const discoverList = discover || [];
        const myIds = new Set(myList.map((g) => String(g.id || g._id)));
        const onlyNotJoined = discoverList.filter(
          (g) => !myIds.has(String(g.id || g._id))
        );
        const shuffled = [...onlyNotJoined].sort(() => Math.random() - 0.5);
        const limited = shuffled.slice(0, 6);
        setMyGroups(myList);
        setDiscoverGroups(limited);
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };

    fetchGroups();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (activeSection !== "groups" || !currentUserId) return;
    let cancelled = false;

    const fetchGroupPosts = async () => {
      try {
        setLoadingGroupPosts(true);
        setGroupsError("");

        if (activeGroup) {
          const data = await postApi.getAll({ groupId: activeGroup, userId: currentUserId }).catch(() => []);
          if (cancelled) return;
          const fetchedPosts = Array.isArray(data) ? data : (data?.posts || []);
          setGroupPosts(fetchedPosts.map(withLikeState));
        } else {
          const mine = await groupApi.getMyGroups(currentUserId);
          if (cancelled) return;
          const myList = mine || [];
          const postPromises = myList.map((g) => {
            const groupId = g.id || g._id;
            if (!groupId) return Promise.resolve([]);
            return postApi.getAll({ groupId, userId: currentUserId }).catch(() => []);
          });
          const results = await Promise.all(postPromises);
          if (cancelled) return;
          const allPosts = results.flat().map(r => Array.isArray(r) ? r : (r?.posts || [])).flat().filter(Boolean);
          setGroupPosts(allPosts.map(withLikeState));
        }
      } catch (err) {
        console.error("Error fetching group posts:", err);
        setGroupsError("Không thể tải bài viết nhóm");
      } finally {
        if (!cancelled) setLoadingGroupPosts(false);
      }
    };

    fetchGroupPosts();
    return () => {
      cancelled = true;
    };
  }, [activeSection, currentUserId, activeGroup, withLikeState]);

  useEffect(() => {
    if (activeSection !== "groups" || !activeGroup || groupDetailTab !== "members") return;
    let cancelled = false;
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const data = await groupApi.getMembers(activeGroup).catch(() => []);
        if (!cancelled) {
          setGroupMembers(Array.isArray(data) ? data : (data?.members || []));
        }
      } catch {
        if (!cancelled) setGroupMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    };
    fetchMembers();
    return () => { cancelled = true; };
  }, [activeSection, activeGroup, groupDetailTab]);

  const handleToggleSavePost = (post) => {
    if (!post) return;
    const rawId = post.id || post._id;
    if (!rawId) return;
    const id = String(rawId);
    setSavedIds((prev) => {
      const nextSet = new Set((prev || []).map((x) => String(x)));
      if (nextSet.has(id)) {
        nextSet.delete(id);
      } else {
        nextSet.add(id);
      }
      const nextArr = Array.from(nextSet);
      try {
        localStorage.setItem(
          "chatwave_saved_posts",
          JSON.stringify(nextArr)
        );
      } catch {
        // ignore localStorage error
      }
      return nextArr;
    });
  };

  const handleCreatePost = async ({
    text,
    imageUrl,
    feeling,
    poll,
    scheduledAt,
  }) => {
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
        authorAvatar: user.avatar || null,
        text,
        imageUrl,
        feeling: feeling || null,
        poll: poll || null,
        scheduledAt: scheduledAt || null,
      });

      setPosts((prev) => [withLikeState(newPost), ...prev]);
      if (scheduledAt) {
        try {
          const d = new Date(scheduledAt);
          const dLocal = new Date(d.getTime() + 7 * 60 * 60 * 1000);
          const dd = String(dLocal.getUTCDate()).padStart(2, "0");
          const mm = String(dLocal.getUTCMonth() + 1).padStart(2, "0");
          const yyyy = dLocal.getUTCFullYear();
          const hh = String(dLocal.getUTCHours()).padStart(2, "0");
          const mi = String(dLocal.getUTCMinutes()).padStart(2, "0");
          toast.success(
            `Bài viết này đã được lên lịch đăng lúc ${hh}:${mi} ngày ${dd}/${mm}/${yyyy} (GMT+7).`
          );
        } catch {
          // ignore format error
        }
      } else {
        toast.success("Đăng bài thành công!");
      }
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
    if (!(await confirm("Bạn có chắc muốn gỡ bài viết này?"))) return;
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

  const handleVotePoll = async (postId, optionIndex) => {
    try {
      const updated = await postApi.votePoll(postId, optionIndex);
      setPosts((prev) =>
        prev.map((p) =>
          (p.id || p._id) === (updated.id || updated._id)
            ? withLikeState({ ...p, ...updated })
            : p
        )
      );
    } catch (err) {
      toast.error(err?.message || "Không thể bình chọn.");
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-80px)] w-full bg-[#F3F6FB] text-base md:text-[17px]">
        <div className={`w-full px-3 md:px-6 py-4 md:py-6 ${activeGroup ? "max-w-4xl mx-auto" : "flex flex-col lg:grid lg:grid-cols-[5fr_8fr_5fr] gap-4 lg:gap-6 items-start"}`}>

          {/* ===== CỘT TRÁI: Sidebar ===== */}
          {!activeGroup && (
            <aside className="hidden lg:flex flex-col gap-6 lg:sticky lg:top-4 self-start">
              <nav className="text-base text-gray-600">
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveSection("all")}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-semibold ${
                        activeSection === "all"
                          ? "bg-[#FFEDD5] text-[#EA580C]"
                          : "hover:bg-white text-gray-700"
                      }`}
                    >
                      <span>Tất cả</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveSection("feed")}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${
                        activeSection === "feed"
                          ? "bg-white text-[#EA580C] font-semibold"
                          : "hover:bg-white text-gray-700"
                      }`}
                    >
                      <span>Bảng tin</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveSection("explore")}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${
                        activeSection === "explore"
                          ? "bg-white text-[#EA580C] font-semibold"
                          : "hover:bg-white text-gray-700"
                      }`}
                    >
                      <span>Khám phá</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveSection("groups")}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${
                        activeSection === "groups"
                          ? "bg-white text-[#EA580C] font-semibold"
                          : "hover:bg-white text-gray-700"
                      }`}
                    >
                      <span>Nhóm</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveSection("saved")}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${
                        activeSection === "saved"
                          ? "bg-white text-[#EA580C] font-semibold"
                          : "hover:bg-white text-gray-700"
                      }`}
                    >
                      <span>Đã lưu</span>
                    </button>
                  </li>
                </ul>
              </nav>

              <div>
                <p className="text-sm md:text-base font-semibold text-gray-700 tracking-wide mb-2">
                  NHÓM CỦA TÔI
                </p>
                <div className="space-y-1 text-sm md:text-base">
                  {myGroups.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveSection("groups")}
                      className="w-full text-left text-xs md:text-sm text-gray-500 hover:text-[#EA580C]"
                    >
                      Bạn chưa tham gia nhóm nào.
                    </button>
                  ) : (
                    <ul className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                      {myGroups.slice(0, 8).map((g) => {
                        const name = g.name || "Nhóm không tên";
                        const initial = name.charAt(0).toUpperCase();
                        const id = g.id || g._id;
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              onClick={() => navigate(`/groups/${id}`)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${
                                activeGroup === id
                                  ? "bg-[#DBEAFE] text-[#2563EB]"
                                  : "hover:bg-white text-gray-700"
                              }`}
                            >
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-[#FF9A44] to-[#FA8DAE] text-[11px] font-semibold text-white shrink-0">
                                {g.avatar ? (
                                  <img src={g.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : initial}
                              </span>
                              <span className="truncate text-xs md:text-sm">{name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* ===== CỘT GIỮA: Feed chính ===== */}
          <div className="flex-1 flex flex-col items-stretch gap-4">
            {/* Tabs cho mobile/tablet */}
            <div className="lg:hidden w-full rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-3 py-2 mb-1">
              <div className="flex items-center justify-between gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveSection("all")}
                  className={`flex-1 px-2 py-1.5 rounded-full ${
                    activeSection === "all"
                      ? "bg-[#FFEDD5] text-[#EA580C] font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("feed")}
                  className={`flex-1 px-2 py-1.5 rounded-full ${
                    activeSection === "feed"
                      ? "bg-[#FFEDD5] text-[#EA580C] font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Bảng tin
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("explore")}
                  className={`flex-1 px-2 py-1.5 rounded-full ${
                    activeSection === "explore"
                      ? "bg-[#FFF7F0] text-[#EA580C] font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Khám phá
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("groups")}
                  className={`flex-1 px-2 py-1.5 rounded-full ${
                    activeSection === "groups"
                      ? "bg-[#FFF7F0] text-[#EA580C] font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Nhóm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("saved")}
                  className={`flex-1 px-2 py-1.5 rounded-full ${
                    activeSection === "saved"
                      ? "bg-[#FFF7F0] text-[#EA580C] font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Đã lưu
                </button>
              </div>
            </div>

            {(activeSection === "feed" || activeSection === "all") && (
              <HomeCreatePost onCreatePost={handleCreatePost} />
            )}

            {/* All Section Header */}
            {activeSection === "all" && (
              <div className="w-full rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-4 py-4 md:px-5 md:py-4 mb-1">
                <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-1">
                  Tất cả bài viết
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Xem tất cả bài viết từ bảng tin, nhóm và bạn bè của bạn.
                </p>
              </div>
            )}

            {error && (
              <div className="w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="w-full flex flex-col gap-4 pb-6">
              {/* Explore Section */}
              {activeSection === "explore" && (
                <div className="w-full rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-4 py-4 md:px-5 md:py-4 mb-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm md:text-base font-semibold text-gray-900">
                        Khám phá bài viết
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">
                        Tìm kiếm chủ đề bạn quan tâm hoặc xem các bài viết nổi bật.
                      </p>
                    </div>
                    <form
                      onSubmit={handleExploreSearch}
                      className="flex items-center gap-2 w-full md:w-auto"
                    >
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo nội dung hoặc tên tác giả..."
                        className="flex-1 md:w-72 text-xs md:text-sm border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-[#4F8EF7] focus:ring-1 focus:ring-[#4F8EF7]"
                        value={exploreQuery}
                        onChange={(e) => setExploreQuery(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-full bg-[#4F8EF7] text-white text-xs md:text-sm font-semibold shadow-sm hover:bg-[#2563EB] transition"
                      >
                        Tìm
                      </button>
                    </form>
                  </div>
                  {exploreError && (
                    <p className="mt-2 text-xs text-red-500">{exploreError}</p>
                  )}
                  {!exploreQuery.trim() && (
                    <p className="mt-2 text-[11px] text-gray-400">
                      Gợi ý: không nhập gì và kéo xuống để xem các bài viết được yêu thích nhiều nhất.
                    </p>
                  )}
                </div>
              )}

              {/* Groups Section */}
              {activeSection === "groups" && (
                <div className="w-full">
                  {activeGroup ? (
                    <>
                      {/* Cover Image - Giống GroupDetailPage */}
                      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                        <div 
                          className="h-40 md:h-52 bg-linear-to-r from-[#FF9A44] to-[#FA8DAE] relative"
                          style={activeGroupInfo?.coverImage ? { backgroundImage: `url(${activeGroupInfo.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                        >
                          <div className="absolute inset-0 bg-black/10" />
                        </div>

                        {/* Group Info Bar */}
                        <div className="px-4 md:px-6 pb-4">
                          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-12 md:-mt-16">
                            {/* Avatar + Name */}
                            <div className="flex items-end gap-4">
                              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
                                {activeGroupInfo?.avatar ? (
                                  <img src={activeGroupInfo.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-3xl md:text-4xl font-bold text-[#FA8DAE]">
                                    {(activeGroupInfo?.name || "N")[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="pb-2">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                                  {activeGroupInfo?.name || "Nhóm"}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                                  {activeGroupInfo?.visibility === "private" ? (
                                    <Lock className="w-4 h-4 inline-block" />
                                  ) : (
                                    <Globe className="w-4 h-4 inline-block" />
                                  )}
                                  <span>{activeGroupInfo?.visibility === "private" ? "Nhóm riêng tư" : "Nhóm công khai"}</span>
                                  <span>·</span>
                                  <span>{(activeGroupInfo?.membersCount || activeGroupInfo?.members?.length || 0).toLocaleString("vi-VN")} thành viên</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                              <button type="button" className="px-4 py-2 rounded-lg bg-[#F9C96D] text-gray-800 font-semibold flex items-center gap-2 hover:bg-[#F7B944] transition">
                                <Bell className="w-5 h-5" />
                                <span className="hidden sm:inline">Đã thông báo</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveGroup(null)}
                                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                              >
                                Quay lại
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="px-4 md:px-6 border-t border-gray-200">
                          <div className="flex gap-1 overflow-x-auto">
                            {[
                              { key: "discussion", label: "Thảo luận" },
                              { key: "about", label: "Giới thiệu" },
                              { key: "members", label: "Thành viên" },
                              { key: "photos", label: "Ảnh" },
                              { key: "settings", label: "Cài đặt" },
                            ].map((tab) => (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setGroupDetailTab(tab.key)}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                  groupDetailTab === tab.key
                                    ? "border-[#FA8DAE] text-[#FA8DAE]"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                {tab.label}
                                {tab.key === "members" && (
                                  <span className="ml-1.5 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                                    {(activeGroupInfo?.membersCount || activeGroupInfo?.members?.length || 0)}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Content - Full width như Khám phá nhóm mới */}
                      <div className="space-y-4">
                        {/* Create Post */}
                        <div className="bg-white rounded-xl shadow-sm p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#FF9A44] to-[#FA8DAE] flex items-center justify-center text-white font-semibold shrink-0">
                              {currentUserName[0].toUpperCase()}
                            </div>
                            <button type="button" className="flex-1 text-left px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-500 text-sm">
                              Viết bài trong nhóm...
                            </button>
                          </div>
                        </div>

                        {/* Tab Content: Discussion/Posts */}
                        {(groupDetailTab === "discussion" || groupDetailTab === "posts") && (
                          <div className="space-y-4">
                            {loadingGroupPosts ? (
                              <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-[#FA8DAE] border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-sm text-gray-500">Đang tải bài viết...</span>
                              </div>
                            ) : groupPosts.length === 0 ? (
                              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF0E0] flex items-center justify-center mb-4">
                                  <Image className="w-8 h-8 text-[#FA8DAE]" />
                                </div>
                                <p className="text-gray-500">Chưa có bài viết nào trong nhóm.</p>
                                <p className="text-sm text-gray-400 mt-1">Hãy là người đầu tiên đăng bài!</p>
                              </div>
                            ) : (
                              groupPosts.map((post, index) => (
                                <HomePostCard
                                  key={post.id ?? post._id ?? `post-${index}`}
                                  post={post}
                                  onToggleLike={handleToggleLike}
                                  onAddComment={handleAddComment}
                                  onShare={handleShare}
                                  onDelete={handleDeletePost}
                                  onEdit={handleEditPost}
                                  onOpenComments={handleOpenComments}
                                  onVotePoll={handleVotePoll}
                                  onToggleSave={handleToggleSavePost}
                                  isSaved={savedIdSet.has(String(post.id || post._id))}
                                />
                              ))
                            )}
                          </div>
                        )}

                        {/* Tab Content: About */}
                        {groupDetailTab === "about" && (
                          <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                            <h3 className="font-semibold text-gray-900">Giới thiệu về nhóm</h3>
                            <div className="space-y-3 text-sm">
                              {activeGroupInfo?.description && (
                                <p className="text-gray-600 pb-3 border-b border-gray-100">{activeGroupInfo.description}</p>
                              )}
                              <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-[#FA8DAE]" />
                                <div>
                                  <p className="font-medium text-gray-900">Ngày tạo</p>
                                  <p className="text-gray-500">
                                    {activeGroupInfo?.createdAt 
                                      ? new Date(activeGroupInfo.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })
                                      : "Không rõ"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {activeGroupInfo?.visibility === "private" ? (
                                  <Lock className="w-5 h-5 text-[#FA8DAE]" />
                                ) : (
                                  <Globe className="w-5 h-5 text-[#FA8DAE]" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">{activeGroupInfo?.visibility === "private" ? "Nhóm riêng tư" : "Nhóm công khai"}</p>
                                  <p className="text-gray-500 text-xs">{activeGroupInfo?.visibility === "private" ? "Chỉ thành viên mới xem bài viết" : "Mọi người đều có thể xem bài viết"}</p>
                                </div>
                              </div>
                              {activeGroupInfo?.ownerName && (
                                <div className="flex items-center gap-3">
                                  <Users className="w-5 h-5 text-[#FA8DAE]" />
                                  <div>
                                    <p className="font-medium text-gray-900">Người tạo</p>
                                    <p className="text-gray-500">{activeGroupInfo.ownerName}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tab Content: Members */}
                        {groupDetailTab === "members" && (
                          <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Thành viên ({(activeGroupInfo?.membersCount || activeGroupInfo?.members?.length || 0)})</h3>
                            {loadingMembers ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-[#FA8DAE] border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-sm text-gray-500">Đang tải...</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {(groupMembers.length > 0 ? groupMembers : activeGroupInfo?.members || []).map((m, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#FF9A44] to-[#FA8DAE] flex items-center justify-center text-white font-bold shrink-0">
                                      {(m.displayName || m.username || "?")[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 text-sm truncate">{m.displayName || m.username}</p>
                                      <p className="text-xs text-[#FA8DAE]">{m.role === "owner" ? "Nhóm trưởng" : m.role === "admin" ? "Nhóm phó" : "Thành viên"}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab Content: Photos */}
                        {groupDetailTab === "photos" && (
                          <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Ảnh</h3>
                            {groupPosts.filter(p => p.imageUrl).length > 0 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {groupPosts.filter(p => p.imageUrl).map((p, idx) => (
                                  <img key={idx} src={p.imageUrl} alt="" className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition" />
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">Chưa có ảnh nào.</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tab Content: Settings */}
                        {groupDetailTab === "settings" && (
                          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                            <h3 className="font-semibold text-gray-900">Cài đặt nhóm</h3>
                            <button type="button" className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                              <Settings className="w-5 h-5 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">Chỉnh sửa nhóm</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* My Groups List */}
                      <div className="w-full rounded-2xl bg-white shadow-sm border border-[#FFE4CC] px-4 py-4 md:px-5 md:py-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#FF9A44] to-[#FF6B35] flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm md:text-base font-bold text-gray-900">
                                Nhóm của tôi
                              </p>
                              <p className="text-xs text-gray-500">
                                {myGroups.length} nhóm đã tham gia
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate("/groups")}
                            className="px-3 py-1.5 rounded-full bg-linear-to-r from-[#FF8C42] to-[#FF6B35] text-white text-xs md:text-sm font-semibold hover:shadow-md transition"
                          >
                            Xem tất cả
                          </button>
                        </div>

                        {myGroups.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-xs md:text-sm text-gray-500 mb-2">
                              Bạn chưa tham gia nhóm nào.
                            </p>
                            <button
                              type="button"
                              onClick={() => navigate("/groups")}
                              className="text-xs text-[#FF6B35] hover:underline font-medium"
                            >
                              Khám phá nhóm mới
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {myGroups.slice(0, 6).map((g) => {
                              const id = g.id || g._id;
                              const name = g.name || "Nhóm không tên";
                              const initial = name.charAt(0).toUpperCase();
                              const count = g.membersCount || g.members?.length || 0;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => navigate(`/groups/${id}`)}
                                  className="shrink-0 w-32 bg-linear-to-br from-[#FFF8F0] to-[#FFE4CC] rounded-xl p-3 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-transform hover:scale-105 border border-[#FFE4CC]"
                                >
                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-sm font-bold text-[#FF6B35] mb-2">
                                    {initial}
                                  </span>
                                  <p className="text-xs font-semibold text-gray-900 truncate w-full">
                                    {name}
                                  </p>
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    {count} thành viên
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Discover Groups */}
                      <div className="w-full rounded-2xl bg-white shadow-sm border border-[#FFE4CC] px-4 py-4 md:px-5 md:py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-900">
                            Khám phá nhóm mới
                          </p>
                          <Sparkles className="w-4 h-4 text-[#FFB74D]" />
                        </div>
                        {loadingGroups ? (
                          <p className="text-xs text-gray-500 text-center py-4">
                            Đang tải nhóm gợi ý...
                          </p>
                        ) : discoverGroups.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-4">
                            Hiện chưa có nhóm gợi ý.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {discoverGroups.slice(0, 4).map((g) => {
                              const id = g.id || g._id;
                              const name = g.name || "Nhóm không tên";
                              const initial = name.charAt(0).toUpperCase();
                              const count = g.membersCount || g.members?.length || 0;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => navigate(`/groups/${id}`)}
                                  className="flex items-center gap-3 p-3 bg-[#FFF8F0] rounded-xl border border-[#FFE4CC] hover:shadow-md transition cursor-pointer text-left"
                                >
                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#FF9A44] to-[#FF6B35] text-white font-bold text-sm shrink-0">
                                    {initial}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 truncate">
                                      {name}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                      {count} thành viên
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Saved Section Header */}
              {activeSection === "saved" && (
                <div className="w-full rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-4 py-4 md:px-5 md:py-4 mb-1">
                  <h2 className="text-sm md:text-base font-semibold text-gray-900 mb-1">
                    Bài viết đã lưu
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500">
                    Những bài viết bạn đã lưu từ bảng tin để xem lại sau sẽ xuất hiện tại đây.
                  </p>
                </div>
              )}

              {/* Posts List */}
              {loading ||
              (activeSection === "explore" && exploreLoading) ||
              (activeSection === "groups" && loadingGroupPosts) ? (
                <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-6 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#4F8EF7] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Đang tải bài viết...</p>
                </div>
              ) : (() => {
                const currentPosts = activeSection === "all"
                  ? [...posts, ...groupPosts].filter((p, i, arr) => arr.findIndex(x => String(x.id || x._id) === String(p.id || p._id)) === i)
                  : activeSection === "feed"
                  ? shuffledPosts
                  : activeSection === "explore"
                  ? exploreList
                  : activeSection === "saved"
                  ? savedPosts
                  : activeSection === "groups"
                  ? groupPosts
                  : [];
                return currentPosts.length === 0 ? (
                  <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-6 text-center space-y-2">
                    <p className="text-sm md:text-base font-medium text-gray-700">
                      {activeSection === "all"
                        ? "Chưa có bài viết nào"
                        : activeSection === "feed"
                        ? "Chưa có bài viết nào trong ngày hôm nay"
                        : activeSection === "explore"
                        ? "Không tìm thấy bài viết nào phù hợp"
                        : activeSection === "saved"
                        ? "Chưa có bài viết nào được lưu"
                        : "Chưa có bài viết nào trong nhóm này"}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {activeSection === "all"
                        ? "Hãy thử khám phá hoặc tham gia nhóm để xem thêm bài viết!"
                        : activeSection === "feed"
                        ? "Hãy là người đầu tiên chia sẻ cảm xúc cùng mọi người nhé!"
                        : activeSection === "explore"
                        ? "Hãy thử tìm với từ khóa khác hoặc quay lại bảng tin."
                        : activeSection === "saved"
                        ? "Hãy bấm Lưu ở menu của một bài viết để xuất hiện tại đây."
                        : "Hãy chọn một nhóm ở bên trái để xem các bài viết."}
                    </p>
                  </div>
                ) : (
                  currentPosts.map((post, index) => (
                    <HomePostCard
                      key={post.id ?? post._id ?? `post-${index}`}
                      post={post}
                      onToggleLike={handleToggleLike}
                      onAddComment={handleAddComment}
                      onShare={handleShare}
                      onDelete={handleDeletePost}
                      onEdit={handleEditPost}
                      onOpenComments={handleOpenComments}
                      onVotePoll={handleVotePoll}
                      onToggleSave={handleToggleSavePost}
                      isSaved={savedIdSet.has(String(post.id || post._id))}
                    />
                  ))
                );
              })()}

              {/* Sentinel for infinite scroll */}
              {(activeSection === "feed" || activeSection === "all") && (
                <div id="scroll-sentinel" className="h-4" />
              )}

              {/* Load more indicator */}
              {loadingMore && (
                <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-4 flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#4F8EF7] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">Đang tải thêm bài viết...</span>
                </div>
              )}

              {/* No more posts */}
              {!hasMore && posts.length > 0 && (activeSection === "feed" || activeSection === "all") && (
                <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-4 text-center">
                  <p className="text-sm text-gray-500">Bạn đã xem hết bài viết</p>
                </div>
              )}
            </div>
          </div>

          {/* ===== CỘT PHẢI: Hot Topics + Gợi ý nhóm ===== */}
          {!activeGroup && (
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
                  {hotTopics.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Chưa đủ dữ liệu để gợi ý chủ đề. Hãy đăng vài bài viết trước nhé!
                    </p>
                  ) : (
                    hotTopics.map((topic, idx) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={async () => {
                          const query = topic;
                          setActiveSection("explore");
                          setExploreQuery(query.replace(/^#/, ""));
                          try {
                            setExploreLoading(true);
                            setExploreError("");
                            const data = await postApi.search(query);
                            setExploreResults(data || []);
                          } catch (err) {
                            setExploreError(
                              err?.message || "Không tìm được bài viết phù hợp."
                            );
                          } finally {
                            setExploreLoading(false);
                          }
                        }}
                        className="w-full text-left"
                      >
                        <p className="text-gray-500">
                          {idx === 0
                            ? "Được nhắc tới nhiều"
                            : idx === 1
                            ? "Cũng đang hot"
                            : "Chủ đề gợi ý"}
                        </p>
                        <p className="font-semibold text-gray-900">{topic}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Modal: View Post */}
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
                ✕
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

      {/* Modal: Share Post */}
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
                ✕
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
    </MainLayout>
  );
}
