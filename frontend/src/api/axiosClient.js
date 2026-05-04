import axios from "axios";

const baseURL =
  (import.meta.env.MODE === "development" && "http://localhost:5001/api/v1") ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001/api/v1";

// Tạo axios instance riêng cho refresh để tránh loop
const refreshAxios = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

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
        // Đang refresh, đợi token mới
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
        // Không có refresh token, chuyển về login
        isRefreshing = false;
        processQueue(new Error("No refresh token"), null);
        logout();
        return Promise.reject(error?.response?.data || { message: "Phiên đăng nhập hết hạn" });
      }

      try {
        // Gọi API refresh token
        const response = await refreshAxios.post("/auth/refresh", { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (accessToken) {
          // Lưu token mới
          localStorage.setItem("chatwave_token", accessToken);
          if (newRefreshToken) {
            localStorage.setItem("chatwave_refresh_token", newRefreshToken);
          }

          // Xử lý các request đang chờ
          processQueue(null, accessToken);

          // Thử lại request ban đầu với token mới
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh thất bại
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

export default axiosClient;
