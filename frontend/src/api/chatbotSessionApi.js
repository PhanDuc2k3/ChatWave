import axiosClient from "./axiosClient";

export const chatbotSessionApi = {
  getSessions() {
    return axiosClient.get("/chatbot-sessions");
  },

  createSession(title = "Cuộc hội thoại mới") {
    return axiosClient.post("/chatbot-sessions", { title });
  },

  getSession(id) {
    return axiosClient.get(`/chatbot-sessions/${id}`);
  },

  updateSession(id, data) {
    return axiosClient.patch(`/chatbot-sessions/${id}`, data);
  },

  deleteSession(id) {
    return axiosClient.delete(`/chatbot-sessions/${id}`);
  },

  getMessages(sessionId) {
    return axiosClient.get(`/chatbot-sessions/${sessionId}/messages`);
  },

  addMessage(sessionId, role, content) {
    return axiosClient.post(`/chatbot-sessions/${sessionId}/messages`, {
      role,
      content,
    });
  },
};
