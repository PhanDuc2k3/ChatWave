import axiosClient from "./axiosClient";

export const friendApi = {
  getFriends(userId) {
    return axiosClient.get("/friends", { params: { userId } });
  },

  getRequests(userId) {
    return axiosClient.get("/friends/requests", { params: { userId } });
  },

  sendRequest(toUserId, fromUserId) {
    return axiosClient.post("/friends/requests", {
      fromUserId,
      toUserId,
    });
  },

  respondRequest(requestId, userId, action) {
    return axiosClient.post(`/friends/requests/${requestId}/respond`, {
      userId,
      action,
    });
  },

  removeFriend(userId, targetId) {
    return axiosClient.delete("/friends", {
      params: { userId, targetId },
    });
  },

  getSuggestions(userId) {
    return axiosClient.get("/friends/suggestions", { params: { userId } });
  },
};

