import axiosClient from "./axiosClient";

export const userApi = {
  getById(id) {
    return axiosClient.get(`/users/${id}`);
  },

  search(query) {
    return axiosClient.get("/users/search", {
      params: { q: query },
    });
  },

  update(id, payload) {
    return axiosClient.put(`/users/${id}`, payload);
  },
};

export const chatApi = {
  getOrCreateConversation(targetUserId) {
    return axiosClient.get("/chats/conversation", {
      params: { targetUserId },
    });
  },
};

