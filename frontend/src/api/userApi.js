import axiosClient from "./axiosClient";

export const userApi = {
  getById(id) {
    return axiosClient.get(`/users/${id}`);
  },

  search(query) {
    return axiosClient.get("/users/search", {
      params: { q: query },
    });
  },
};

