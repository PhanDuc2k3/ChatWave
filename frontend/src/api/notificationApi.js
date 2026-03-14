import axiosClient from "./axiosClient";

export const notificationApi = {
  getNotifications() {
    return axiosClient.get("/notifications");
  },

  markAsRead(id) {
    return axiosClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return axiosClient.post("/notifications/read-all");
  },
};
