import axiosClient from "./axiosClient";

export const authApi = {
  login(credentials) {
    return axiosClient.post("/auth/login", credentials);
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

