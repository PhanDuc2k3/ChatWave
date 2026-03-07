import axiosClient from "./axiosClient";

export const messageApi = {
  getConversations(userId) {
    return axiosClient.get("/chats/conversations", {
      params: userId ? { userId } : undefined,
    });
  },

  getMessages(conversationId) {
    return axiosClient.get(`/chats/${conversationId}/messages`);
  },

  sendMessage(conversationId, payload) {
    return axiosClient.post(`/chats/${conversationId}/messages`, payload);
  },
};

