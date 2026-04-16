import axios from "axios";

const baseURL =
  (import.meta.env.MODE === "development" && "http://localhost:5003/api/v1") ||
  import.meta.env.VITE_CHATBOT_API_URL ||
  "http://localhost:5003/api/v1";

const chatbotClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: 90000,
});

chatbotClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err?.response?.data?.message || err.message || "Lỗi kết nối chatbot";
    return Promise.reject({ message: msg });
  }
);

export const chatbotApi = {
  chat(messages, teamId = "default-team", options = {}) {
    return chatbotClient.post("/chat/completions", {
      messages,
      teamId,
      model: options.model || "llama-3.3-70b-versatile",
      max_tokens: options.max_tokens || 1024,
      temperature: options.temperature ?? 0.7,
    });
  },

  createTasksFromChat(messages) {
    return chatbotClient.post("/chat/create-tasks", { messages });
  },

  applyAiActions(actions, teamId = "default-team") {
    return chatbotClient.post("/ai/execute-actions", { actions, teamId });
  },
};
