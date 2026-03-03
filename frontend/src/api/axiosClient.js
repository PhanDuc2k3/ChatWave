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
  (error) => {
    // Chuẩn hoá error để component xử lý đơn giản
    const apiError = error?.response?.data || {
      message: error.message || "Có lỗi kết nối đến server",
    };
    return Promise.reject(apiError);
  }
);

export default axiosClient;

