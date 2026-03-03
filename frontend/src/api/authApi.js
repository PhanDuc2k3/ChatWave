import axiosClient from "./axiosClient";

export const authApi = {
  login(credentials) {
    return axiosClient.post("/auth/login", credentials);
  },

  register(payload) {
    return axiosClient.post("/auth/register", payload);
  },
};

