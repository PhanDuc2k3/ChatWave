import axios from "axios";
import { CHATBOT_API } from "../utils/apiConfig";

const IS_DEV = import.meta.env.MODE === "development";

// Base URL - sẽ được xác định sau khi test
let currentBaseUrl = CHATBOT_API.primary;

// Tạo axios instance
const chatbotClient = axios.create({
  baseURL: currentBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: 90000,
});

// Test localhost và setup fallback
async function ensureCorrectBaseUrl() {
  if (!IS_DEV) {
    currentBaseUrl = CHATBOT_API.vps;
    chatbotClient.defaults.baseURL = currentBaseUrl;
    console.log("[Chatbot] Using VPS:", currentBaseUrl);
    return currentBaseUrl;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Chatbot service health endpoint ở /health (không có /api/v1)
    await fetch(`${CHATBOT_API.localhostBase}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    currentBaseUrl = CHATBOT_API.localhost;
    chatbotClient.defaults.baseURL = currentBaseUrl;
    console.log("[Chatbot] Using localhost:", currentBaseUrl);
    return currentBaseUrl;
  } catch {
    currentBaseUrl = CHATBOT_API.vps;
    chatbotClient.defaults.baseURL = currentBaseUrl;
    console.warn("[Chatbot] Localhost unavailable, using VPS:", currentBaseUrl);
    return currentBaseUrl;
  }
}

// Initialize
let initPromise = ensureCorrectBaseUrl();

export async function waitForChatbotInit() {
  return initPromise;
}

const clientInterceptor = (res) => res.data;
const errorInterceptor = (err) => {
  const msg = err?.response?.data?.message || err.message || "Lỗi kết nối chatbot";
  return Promise.reject({ message: msg });
};

chatbotClient.interceptors.response.use(clientInterceptor, errorInterceptor);

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
