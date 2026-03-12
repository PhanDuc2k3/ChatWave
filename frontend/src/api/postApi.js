import axiosClient from "./axiosClient";

export const postApi = {
  getAll(params = {}) {
    return axiosClient.get("/posts", { params });
  },

  getById(id) {
    return axiosClient.get(`/posts/${id}`);
  },

  getByAuthor(userId) {
    return axiosClient.get(`/posts/by-author/${userId}`);
  },

  create(payload) {
    return axiosClient.post("/posts", payload);
  },

  update(postId, payload) {
    return axiosClient.patch(`/posts/${postId}`, payload);
  },

  search(query) {
    return axiosClient.get("/posts/search", { params: { q: query } });
  },

  addComment(postId, payload) {
    return axiosClient.post(`/posts/${postId}/comments`, payload);
  },

  like(postId, userId) {
    return axiosClient.post(`/posts/${postId}/like`, { userId });
  },

  remove(postId) {
    return axiosClient.delete(`/posts/${postId}`);
  },
};

