import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

const axiosUpload = axios.create({
  baseURL,
  withCredentials: false,
});

axiosUpload.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("chatwave_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosUpload.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const apiError = error?.response?.data || {
      message: error.message || "Tải ảnh lên thất bại",
    };
    return Promise.reject(apiError);
  }
);

export const uploadApi = {
  uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    return axiosUpload.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
