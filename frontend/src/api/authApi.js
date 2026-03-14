import axios from "axios";
import axiosClient from "./axiosClient";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

export const authApi = {
  login(credentials) {
    return axiosClient.post("/auth/login", credentials);
  },

  refresh(refreshToken) {
    return axios.post(`${baseURL}/auth/refresh`, { refreshToken }).then((r) => r.data);
  },

  register(payload) {
    return axiosClient.post("/auth/register", payload);
  },

  changePassword(userId, currentPassword, newPassword) {
    return axiosClient.post("/auth/change-password", {
      userId,
      currentPassword,
      newPassword,
    });
  },

  forgotPassword(email) {
    return axiosClient.post("/auth/forgot-password", { email });
  },

  resetPassword(token, newPassword) {
    return axiosClient.post("/auth/reset-password", { token, newPassword });
  },
};

