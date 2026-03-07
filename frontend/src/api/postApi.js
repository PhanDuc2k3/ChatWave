import axiosClient from "./axiosClient";

export const postApi = {
  getAll() {
    return axiosClient.get("/posts");
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

