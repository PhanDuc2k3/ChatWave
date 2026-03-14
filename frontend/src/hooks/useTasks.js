import { useState, useEffect, useCallback } from "react";
import { taskApi } from "../api/taskApi";

function mapTaskFromApi(t) {
  return {
    id: t.id || t._id,
    title: t.title,
    assigner: t.assignerName,
    assignerId: t.assignerId,
    assigneeId: t.assigneeId,
    assignee: t.assigneeName || "Chưa giao",
    reviewer: t.reviewerName || null,
    source: t.source || "friend",
    sourceName: t.sourceName,
    dueDate: t.dueDate || "—",
    status: t.status || "pending",
    priority: t.priority || "medium",
    description: t.description ? { what: t.description } : null,
    expectedResults: t.expectedResults || [],
    estimatedEffort: t.estimatedEffort || null,
    acceptanceCriteria: t.acceptanceCriteria || [],
    deliverables: t.deliverables || [],
    references: t.references || [],
    risksNotes: t.risksNotes || null,
    completionNote: t.completionNote || null,
    completedAt: t.completedAt || null,
    submissionDeliverables: t.submissionDeliverables || [],
    ...t,
  };
}

function getCurrentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("chatwave_user") || "null");
    return u?.id || u?._id || null;
  } catch {
    return null;
  }
}

export function useTasks() {
  const [filter, setFilter] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const currentUserId = getCurrentUserId();

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data =
        filter === "mine" && currentUserId
          ? await taskApi.getByAssignee(currentUserId)
          : await taskApi.getAll();
      const mapped = (data || []).map(mapTaskFromApi);
      setTasks(mapped);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filter, currentUserId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateTaskStatus = useCallback(async (taskId, status) => {
    try {
      const updated = await taskApi.updateStatus(taskId, status);
      if (updated) {
        const mapped = mapTaskFromApi(updated);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId || t.id === mapped.id ? { ...t, ...mapped } : t
          )
        );
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
    }
  }, []);

  const removeTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTaskId(null);
  }, []);

  const updateTask = useCallback((updatedTaskFromApi) => {
    if (!updatedTaskFromApi) return;
    const mapped = mapTaskFromApi(updatedTaskFromApi);
    const id = mapped.id || updatedTaskFromApi._id || updatedTaskFromApi.id;
    setTasks((prev) => prev.map((t) => (t.id === id ? mapped : t)));
    setSelectedTaskId(id);
  }, []);

  const submitTask = useCallback((updatedTaskFromApi) => {
    if (!updatedTaskFromApi) return;
    const mapped = mapTaskFromApi(updatedTaskFromApi);
    const id = mapped.id || updatedTaskFromApi._id || updatedTaskFromApi.id;
    setTasks((prev) => prev.map((t) => (t.id === id ? mapped : t)));
  }, []);

  const selectedTask =
    selectedTaskId != null
      ? tasks.find((t) => t.id === selectedTaskId)
      : null;

  return {
    tasks,
    loading,
    filter,
    setFilter,
    selectedTask,
    selectedTaskId,
    setSelectedTaskId,
    refetch: fetch,
    updateTaskStatus,
    removeTask,
    updateTask,
    submitTask,
    currentUserId,
    mapTaskFromApi,
  };
}
