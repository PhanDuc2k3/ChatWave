import { useState, useEffect, useCallback } from "react";
import { groupApi } from "../api/groupApi";

function getCurrentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("chatwave_user") || "null");
    return u?.id || u?._id || null;
  } catch {
    return null;
  }
}

export function useGroups(options = {}) {
  const { onError } = options;
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = getCurrentUserId();

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await groupApi.getDiscoverable(currentUserId);
      setGroups(data || []);
    } catch (err) {
      setGroups([]);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, onError]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const setGroupsState = useCallback((updater) => {
    setGroups(updater);
  }, []);

  return {
    groups,
    setGroups: setGroupsState,
    loading,
    refetch: fetch,
    currentUserId,
  };
}
