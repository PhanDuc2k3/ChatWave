import { useState, useEffect, useCallback } from "react";
import { userApi } from "../api/userApi";
import { friendApi } from "../api/friendApi";
import { postApi } from "../api/postApi";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  } catch {
    return null;
  }
}

export function useProfile(profileIdParam, mockProfile, options = {}) {
  const { onError } = options;
  const [profile, setProfile] = useState(mockProfile || {});
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [userFriends, setUserFriends] = useState([]);

  const storedUser = getCurrentUser();
  const currentUserId = storedUser?.id || storedUser?._id || null;
  const profileUserId = profileIdParam || currentUserId;
  const isMe =
    !profileIdParam ||
    !currentUserId ||
    String(profileUserId) === String(currentUserId);

  const fetch = useCallback(async () => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        if (!profileUserId) {
          setProfile(mockProfile || {});
          setLoading(false);
          return;
        }

        const [fresh, posts, friends] = await Promise.all([
          userApi.getById(profileUserId),
          postApi.getByAuthor(profileUserId),
          friendApi.getFriends(profileUserId),
        ]);

        if (isMounted && fresh) {
          setProfile((prev) => ({
            ...prev,
            name: fresh.username || fresh.name || prev.name,
            username: fresh.email || prev.username,
            bio: fresh.bio ?? prev.bio,
            avatar: fresh.avatar ?? prev.avatar,
            stats: {
              posts: posts?.length || 0,
              friends: friends?.length || 0,
              photos: (posts || []).filter((p) => p.imageUrl).length,
            },
          }));
          setUserPosts(posts || []);
          setUserFriends(friends || []);
        }
      } catch (err) {
        if (isMounted) {
          setProfile(mockProfile || {});
          onError?.(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchFriendState = async () => {
      if (!currentUserId || !profileUserId || isMe) return;
      try {
        const friends = await friendApi.getFriends(currentUserId);
        const found = (friends || []).some(
          (f) => String(f.id) === String(profileUserId)
        );
        if (isMounted) setIsFriend(found);
      } catch {
        // ignore
      }
    };

    fetchProfile();
    fetchFriendState();

    return () => {
      isMounted = false;
    };
  }, [profileUserId, currentUserId, isMe, mockProfile, onError]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateProfile = useCallback((updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    profile,
    setProfile,
    loading,
    isFriend,
    setIsFriend,
    userPosts,
    setUserPosts,
    userFriends,
    currentUserId,
    profileUserId,
    isMe,
    refetch: fetch,
    updateProfile,
  };
}
