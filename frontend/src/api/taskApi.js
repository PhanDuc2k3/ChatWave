import axiosClient from "./axiosClient";

export const taskApi = {
  create(payload) {
    return axiosClient.post("/tasks", payload);
  },

  getAll() {
    return axiosClient.get("/tasks");
  },

  getByAssignee(userId) {
    return axiosClient.get("/tasks/by-assignee", { params: { userId } });
  },

  getById(id) {
    return axiosClient.get(`/tasks/${id}`);
  },

  submitTask(taskId, payload) {
    return axiosClient.post(`/tasks/${taskId}/submit`, payload);
  },

  updateStatus(taskId, status) {
    return axiosClient.patch(`/tasks/${taskId}/status`, { status });
  },

  update(taskId, payload) {
    return axiosClient.patch(`/tasks/${taskId}`, payload);
  },

  delete(taskId) {
    return axiosClient.delete(`/tasks/${taskId}`);
  },

  reassign(taskId, assigneeId, assigneeName) {
    return axiosClient.patch(`/tasks/${taskId}/reassign`, {
      assigneeId,
      assigneeName,
    });
  },
};
