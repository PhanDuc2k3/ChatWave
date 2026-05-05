import axios from "axios";
import { CORE_API } from "../utils/apiConfig";

const IS_DEV = import.meta.env.MODE === "development";

// Base URL - sẽ được xác định sau khi test
let currentBaseUrl = CORE_API.primary;

// Tạo axios instance với baseURL tạm thời
const axiosClient = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Refresh axios instance
const refreshAxios = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Test và switch sang localhost hoặc fallback
async function ensureCorrectBaseUrl() {
  if (!IS_DEV) {
    currentBaseUrl = CORE_API.vps;
    axiosClient.defaults.baseURL = currentBaseUrl;
    refreshAxios.defaults.baseURL = currentBaseUrl;
    console.log("[API] Using VPS:", currentBaseUrl);
    return currentBaseUrl;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Core API health endpoint là /api/v1/health
    await fetch(`${CORE_API.localhost}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    currentBaseUrl = CORE_API.localhost;
    axiosClient.defaults.baseURL = currentBaseUrl;
    refreshAxios.defaults.baseURL = currentBaseUrl;
    console.log("[API] Using localhost:", currentBaseUrl);
    return currentBaseUrl;
  } catch {
    currentBaseUrl = CORE_API.vps;
    axiosClient.defaults.baseURL = currentBaseUrl;
    refreshAxios.defaults.baseURL = currentBaseUrl;
    console.warn("[API] Localhost unavailable, using VPS:", currentBaseUrl);
    return currentBaseUrl;
  }
}

// Initialize ngay - async nhưng các API calls sẽ đợi nếu cần
let initPromise = ensureCorrectBaseUrl();

// Hàm để các API calls đợi initialization
export async function waitForInit() {
  return initPromise;
}

// Queue để xử lý các request bị chặn khi đang refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Thêm access token vào header
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("chatwave_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý response - handle refresh token khi 401
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Các endpoint không cần refresh token
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/forgot-password") ||
      originalRequest?.url?.includes("/auth/reset-password");

    // Nếu là lỗi 401 và không phải request thử lại và không phải auth endpoint
    if (error?.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem("chatwave_refresh_token");

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(new Error("No refresh token"), null);
        logout();
        return Promise.reject(error?.response?.data || { message: "Phiên đăng nhập hết hạn" });
      }

      try {
        // Đợi baseURL được xác định trước
        await initPromise;
        
        const response = await refreshAxios.post("/auth/refresh", { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (accessToken) {
          localStorage.setItem("chatwave_token", accessToken);
          if (newRefreshToken) {
            localStorage.setItem("chatwave_refresh_token", newRefreshToken);
          }

          processQueue(null, accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        return Promise.reject(refreshError?.response?.data || { message: "Phiên đăng nhập hết hạn" });
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error?.response?.data || { message: error.message || "Lỗi server" });
  }
);

// Hàm logout
export const logout = () => {
  localStorage.removeItem("chatwave_token");
  localStorage.removeItem("chatwave_refresh_token");
  localStorage.removeItem("chatwave_user");
  window.location.href = "/login";
};

// Hàm kiểm tra token
export const isAuthenticated = () => {
  return !!localStorage.getItem("chatwave_token");
};

export const getCurrentBaseUrl = () => currentBaseUrl;

export default axiosClient;
