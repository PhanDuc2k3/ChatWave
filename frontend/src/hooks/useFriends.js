import { useState, useEffect, useCallback } from "react";
import { friendApi } from "../api/friendApi";

function getCurrentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("chatwave_user") || "null");
    return u?.id || u?._id || null;
  } catch {
    return null;
  }
}

export function useFriends(options = {}) {
  const { onError } = options;
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = getCurrentUserId();

  const fetch = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [reqData, sugData] = await Promise.all([
        friendApi.getRequests(currentUserId),
        friendApi.getSuggestions(currentUserId),
      ]);
      setRequests(reqData?.incoming || []);
      setSuggestions(sugData || []);
    } catch (err) {
      setRequests([]);
      setSuggestions([]);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, onError]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const removeRequest = useCallback((requestId) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const removeSuggestion = useCallback((userId) => {
    setSuggestions((prev) =>
      prev.filter((s) => String(s.id || s._id) !== String(userId))
    );
  }, []);

  return {
    requests,
    suggestions,
    loading,
    refetch: fetch,
    currentUserId,
    setRequests,
    removeRequest,
    removeSuggestion,
    setSuggestions,
  };
}
