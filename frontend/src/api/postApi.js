import axiosClient from "./axiosClient";

export const postApi = {
  getAll() {
    return axiosClient.get("/posts");
  },

  getById(id) {
    return axiosClient.get(`/posts/${id}`);
  },

  create(payload) {
    return axiosClient.post("/posts", payload);
  },

  addComment(postId, payload) {
    return axiosClient.post(`/posts/${postId}/comments`, payload);
  },

  like(postId) {
    return axiosClient.post(`/posts/${postId}/like`);
  },
};

