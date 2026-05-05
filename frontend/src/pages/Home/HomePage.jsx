import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
  const [activeSection, setActiveSection] = useState("feed"); // "feed" | "explore" | "groups" | "saved"
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
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupVisibility, setNewGroupVisibility] = useState("public");
  const [creatingGroup, setCreatingGroup] = useState(false);
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
    // Nếu chưa tìm kiếm, hiển thị bài "nổi bật" theo lượt thích
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
      // 1. Từ field hashtags (ưu tiên)
      const savedHashtags = Array.isArray(p.hashtags) ? p.hashtags : [];
      savedHashtags.forEach((tag) => {
        const key = String(tag).toLowerCase();
        if (key.length >= 2 && key.length <= 40) {
          tagCount.set(key, (tagCount.get(key) || 0) + 2); // Ưu tiên cao hơn
        }
      });

      // 2. Từ text (trích xuất thêm)
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

  // Posts hiển thị ngẫu nhiên - shuffle mỗi khi posts thay đổi
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

  // Infinite scroll - dùng Intersection Observer
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

  // Đồng bộ "Nhóm của tôi" ở sidebar bằng API
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
          // Normalize data - có thể trả về array hoặc object
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

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên nhóm.");
      return;
    }
    if (!currentUserId) {
      toast.error("Bạn cần đăng nhập để tạo nhóm.");
      return;
    }
    try {
      setCreatingGroup(true);
      const payload = {
        name,
        description: newGroupDescription.trim(),
        ownerId: currentUserId,
        ownerName: currentUserName,
        visibility: newGroupVisibility,
      };
      const group = await groupApi.create(payload);
      toast.success("Đã tạo nhóm mới.");
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupVisibility("public");
      // Cập nhật lại danh sách nhóm (nhóm mới tạo cũng được tính vào feed nhóm)
      setMyGroups((prev) => [group, ...(prev || [])]);
    } catch (err) {
      toast.error(err?.message || "Không tạo được nhóm, vui lòng thử lại.");
    } finally {
      setCreatingGroup(false);
    }
  };

  // Fetch groups data (cho sidebar)
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

  // Fetch posts cho groups section
  useEffect(() => {
    if (activeSection !== "groups" || !currentUserId) return;
    let cancelled = false;

    const fetchGroupPosts = async () => {
      try {
        setLoadingGroupPosts(true);
        setGroupsError("");
        
        // Nếu có activeGroup được chọn, chỉ fetch bài viết của nhóm đó
        if (activeGroup) {
          const data = await postApi.getAll({ groupId: activeGroup, userId: currentUserId }).catch(() => []);
          if (cancelled) return;
          const posts = Array.isArray(data) ? data : (data?.posts || []);
          setGroupPosts(posts.map(withLikeState));
        } else {
          // Nếu không có activeGroup, fetch tất cả bài viết từ các nhóm của user
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

  const handleSelectGroup = async () => {
    // Đã dùng trang /groups/:id để xem chi tiết, nên hàm này không còn cần cho Home
  };

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
          // Chuyển từ UTC sang GMT+7 để hiển thị cho người dùng
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
      {/* Nền tổng giống app social: xanh rất nhạt, card trắng */}
      <div className="min-h-[calc(100vh-80px)] w-full bg-[#F3F6FB] text-base md:text-[17px]">
        <div className="w-full px-3 md:px-6 py-4 md:py-6 flex flex-col lg:grid lg:grid-cols-[5fr_8fr_5fr] gap-4 lg:gap-6 items-start">
          {/* Cột 1: menu nhỏ + Nhóm của tôi (desktop) */}
          <aside className="hidden lg:flex flex-col gap-6 lg:sticky lg:top-4 self-start">
            <nav className="text-base text-gray-600">
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveSection("feed")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-semibold ${
                      activeSection === "feed"
                        ? "bg-[#FFEDD5] text-[#EA580C]"
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
                            onClick={() => {
                              setActiveSection("groups");
                              setActiveGroup(id);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${
                              activeGroup === id
                                ? "bg-[#DBEAFE] text-[#2563EB]"
                                : "hover:bg-white text-gray-700"
                            }`}
                          >
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#DBEAFE] text-[11px] font-semibold text-[#2563EB] shrink-0">
                              {initial}
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

          {/* Cột 2: tạo bài & feed */}
          <div className="flex-1 flex flex-col items-stretch gap-4">
            {/* Tabs cho mobile/tablet */}
            <div className="lg:hidden w-full rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-3 py-2 mb-1">
              <div className="flex items-center justify-between gap-1 text-xs">
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
            {activeSection === "feed" && (
              <HomeCreatePost onCreatePost={handleCreatePost} />
            )}

            {error && (
              <div className="w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="w-full flex flex-col gap-4 pb-6">
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

              {activeSection === "groups" && (
                <div className="w-full flex flex-col gap-4 pb-6">
                  {activeGroupInfo ? (
                    <>
                      {/* Header với nút quay lại và tạo nhóm */}
                      <div className="w-full rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-4 py-4 md:px-5 md:py-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveGroup(null)}
                              className="p-2 rounded-full hover:bg-gray-100"
                            >
                              <span className="text-gray-600">←</span>
                            </button>
                            <div>
                              <p className="text-sm md:text-base font-semibold text-gray-900">
                                {activeGroupInfo.name}
                              </p>
                              {activeGroupInfo.description && (
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {activeGroupInfo.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCreateGroup(true)}
                            className="px-3 py-1.5 rounded-full bg-[#FA8DAE] text-white text-xs md:text-sm font-semibold hover:opacity-90 transition"
                          >
                            + Tạo nhóm mới
                          </button>
                        </div>
                        {groupsError && (
                          <p className="text-xs text-red-500 mb-2">
                            {groupsError}
                          </p>
                        )}
                        {myGroups.length > 0 && (
                          <div className="mb-3">
                            <p className="font-semibold text-gray-900 mb-2 text-sm">
                              Nhóm của bạn
                            </p>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {myGroups.slice(0, 8).map((g) => {
                                const id = g.id || g._id;
                                const name = g.name || "Nhóm không tên";
                                const initial = name.charAt(0).toUpperCase();
                                const count = g.membersCount || g.members?.length || 0;
                                return (
                                  <div
                                    key={id}
                                    className="flex-shrink-0 w-36 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-xl p-3 flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => setActiveGroup(id)}
                                  >
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-sm font-bold text-[#2563EB] mb-2">
                                      {initial}
                                    </span>
                                    <p className="text-xs font-semibold text-gray-900 truncate w-full">
                                      {name}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      {count} thành viên
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
                          <div className="border border-gray-100 rounded-xl p-3 col-span-1 md:col-span-2">
                            <p className="font-semibold text-gray-900 mb-2">
                              Gợi ý tham gia
                            </p>
                            {loadingGroups ? (
                              <p className="text-gray-500 text-xs">
                                Đang tải nhóm gợi ý...
                              </p>
                            ) : discoverGroups.length === 0 ? (
                              <p className="text-gray-500 text-xs">
                                Hiện chưa có nhóm gợi ý.
                              </p>
                            ) : (
                              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {discoverGroups.map((g) => {
                                  const id = g.id || g._id;
                                  const name = g.name || "Nhóm không tên";
                                  const initial = name.charAt(0).toUpperCase();
                                  const count = g.membersCount || g.members?.length || 0;
                                  return (
                                    <div
                                      key={id}
                                      className="flex-shrink-0 w-36 bg-gradient-to-br from-[#FFF7F0] to-[#FFEDD5] rounded-xl p-3 flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => navigate(`/groups/${id}`)}
                                    >
                                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm text-lg font-bold text-[#EA580C] mb-2">
                                        {initial}
                                      </span>
                                      <p className="text-sm font-semibold text-gray-900 truncate w-full">
                                        {name}
                                      </p>
                                      <p className="text-[10px] text-gray-500 mt-1">
                                        {count.toLocaleString("vi-VN")} thành viên
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-full rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3 md:px-4 md:py-3 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm md:text-base font-semibold text-gray-900">
                              {activeGroupInfo.name}
                            </p>
                            {activeGroupInfo.description && (
                              <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                                {activeGroupInfo.description}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] md:text-xs font-medium border border-[#E5E7EB] text-gray-600 bg-white">
                            {activeGroupInfo.visibility === "private"
                              ? "Nhóm riêng tư"
                              : "Nhóm công khai"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] md:text-xs text-gray-500">
                          <span>
                            {(activeGroupInfo.membersCount ||
                              activeGroupInfo.members?.length ||
                              0
                            ).toLocaleString("vi-VN")}{" "}
                            thành viên
                          </span>
                          {activeGroupInfo.createdAt && (
                            <span>
                              Tạo ngày{" "}
                              {new Date(activeGroupInfo.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full rounded-2xl bg-white shadow-sm border border-[#E2E8F0] px-4 py-4 md:px-5 md:py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <p className="text-xs md:text-sm text-gray-500">
                          Chọn một nhóm để xem bài viết hoặc tham gia nhóm mới.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCreateGroup(true)}
                          className="px-3 py-1.5 rounded-full bg-[#FA8DAE] text-white text-xs md:text-sm font-semibold hover:opacity-90 transition"
                        >
                          + Tạo nhóm mới
                        </button>
                      </div>
                      {myGroups.length === 0 ? (
                        <p className="text-xs md:text-sm text-gray-500 text-center py-4">
                          Bạn chưa tham gia nhóm nào.
                        </p>
                      ) : (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {myGroups.slice(0, 8).map((g) => {
                            const id = g.id || g._id;
                            const name = g.name || "Nhóm không tên";
                            const initial = name.charAt(0).toUpperCase();
                            const count = g.membersCount || g.members?.length || 0;
                            return (
                              <div
                                key={id}
                                className="flex-shrink-0 w-36 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-xl p-3 flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setActiveGroup(id)}
                              >
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-sm font-bold text-[#2563EB] mb-2">
                                  {initial}
                                </span>
                                <p className="text-xs font-semibold text-gray-900 truncate w-full">
                                  {name}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {count} thành viên
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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

              {loading ||
              (activeSection === "explore" && exploreLoading) ||
              (activeSection === "groups" && loadingGroupPosts) ? (
                <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-6 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#4F8EF7] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">
                    Đang tải bài viết...
                  </p>
                </div>
              ) : (
                (activeSection === "feed"
                  ? shuffledPosts
                  : activeSection === "explore"
                  ? exploreList
                  : activeSection === "saved"
                  ? savedPosts
                  : activeSection === "groups"
                  ? groupPosts
                  : []
                ).length === 0
              ) ? (
                <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-6 text-center space-y-2">
                  <p className="text-sm md:text-base font-medium text-gray-700">
                    {activeSection === "feed"
                      ? "Chưa có bài viết nào trong ngày hôm nay"
                      : activeSection === "explore"
                      ? "Không tìm thấy bài viết nào phù hợp"
                      : activeSection === "saved"
                      ? "Chưa có bài viết nào được lưu"
                      : "Chưa có bài viết nào trong nhóm này"}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    {activeSection === "feed"
                      ? "Hãy là người đầu tiên chia sẻ cảm xúc cùng mọi người nhé!"
                      : activeSection === "explore"
                      ? "Hãy thử tìm với từ khóa khác hoặc quay lại bảng tin."
                      : activeSection === "saved"
                      ? "Hãy bấm Lưu ở menu của một bài viết để xuất hiện tại đây."
                      : "Hãy chọn một nhóm ở bên trái để xem các bài viết."}
                  </p>
                </div>
              ) : (
                (activeSection === "feed"
                  ? shuffledPosts
                  : activeSection === "explore"
                  ? exploreList
                  : activeSection === "saved"
                  ? savedPosts
                  : activeSection === "groups"
                  ? groupPosts
                  : []
                ).map((post, index) => (
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

              {/* Sentinel for infinite scroll */}
              {activeSection === "feed" && (
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
              {!hasMore && posts.length > 0 && activeSection === "feed" && (
                <div className="w-full rounded-2xl bg-white shadow-sm px-4 py-4 text-center">
                  <p className="text-sm text-gray-500">Bạn đã xem hết bài viết</p>
                </div>
              )}
            </div>
          </div>

          {/* Cột 3: Chủ đề nổi bật + Nhóm gợi ý (desktop) */}
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
                        const query = topic; // giữ nguyên dấu #
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

        {showCreateGroup && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-3">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-base font-semibold text-gray-900">
                  Tạo nhóm mới
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (creatingGroup) return;
                    setShowCreateGroup(false);
                    setNewGroupName("");
                    setNewGroupDescription("");
                    setNewGroupVisibility("public");
                  }}
                  className="text-gray-500 hover:text-gray-700 text-lg px-2"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tên nhóm *
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ví dụ: Team UI/UX, Câu lạc bộ AI..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs md:text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Mô tả (tuỳ chọn)
                  </label>
                  <textarea
                    rows={3}
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Giới thiệu ngắn gọn về nhóm của bạn."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs md:text-sm outline-none resize-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quyền hiển thị
                  </label>
                  <div className="flex items-center gap-3 text-xs md:text-sm">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        className="accent-[#FA8DAE]"
                        value="public"
                        checked={newGroupVisibility === "public"}
                        onChange={(e) => setNewGroupVisibility(e.target.value)}
                      />
                      <span>Công khai</span>
                    </label>
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        className="accent-[#FA8DAE]"
                        value="private"
                        checked={newGroupVisibility === "private"}
                        onChange={(e) => setNewGroupVisibility(e.target.value)}
                      />
                      <span>Riêng tư</span>
                    </label>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Công khai: ai cũng có thể tìm thấy nhóm. Riêng tư: chỉ thành viên mới xem được nội dung.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (creatingGroup) return;
                      setShowCreateGroup(false);
                      setNewGroupName("");
                      setNewGroupDescription("");
                      setNewGroupVisibility("public");
                    }}
                    className="px-3 py-1.5 rounded-full border border-gray-300 text-xs md:text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creatingGroup}
                    className="px-4 py-1.5 rounded-full bg-[#FA8DAE] text-white text-xs md:text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingGroup ? "Đang tạo..." : "Tạo nhóm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

