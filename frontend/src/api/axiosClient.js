import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(err, token = null) {
  failedQueue.forEach((prom) => (err ? prom.reject(err) : prom.resolve(token)));
  failedQueue = [];
}

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("chatwave_token");
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    const isAuthUrl =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");
    if (error?.response?.status === 401 && !originalRequest._retry && !isAuthUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err?.response?.data || { message: err?.message }));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem("chatwave_refresh_token");

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem("chatwave_token");
        localStorage.removeItem("chatwave_refresh_token");
        localStorage.removeItem("chatwave_user");
        window.location.href = "/login";
        return Promise.reject(
          error?.response?.data || { message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." }
        );
      }

      try {
        const { authApi } = await import("./authApi");
        const { accessToken, refreshToken: newRefresh } = await authApi.refresh(refreshToken);
        localStorage.setItem("chatwave_token", accessToken);
        if (newRefresh) localStorage.setItem("chatwave_refresh_token", newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        const res = await axios({
          ...originalRequest,
          baseURL,
        });
        return res.data;
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("chatwave_token");
        localStorage.removeItem("chatwave_refresh_token");
        localStorage.removeItem("chatwave_user");
        window.location.href = "/login";
        return Promise.reject(
          refreshErr?.message
            ? { message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." }
            : error?.response?.data || { message: "Có lỗi kết nối đến server" }
        );
      } finally {
        isRefreshing = false;
      }
    }

    const apiError = error?.response?.data || {
      message: error.message || "Có lỗi kết nối đến server",
    };
    return Promise.reject(apiError);
  }
);

export default axiosClient;

