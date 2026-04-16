import axiosClient from "./axiosClient";

export const chatGroupApi = {
  create(payload) {
    return axiosClient.post("/chat-groups", payload);
  },

  getMyGroups(userId) {
    return axiosClient.get("/chat-groups", { params: { userId } });
  },

  getById(id) {
    return axiosClient.get(`/chat-groups/${id}`);
  },

  addMember(groupId, payload) {
    return axiosClient.post(`/chat-groups/${groupId}/members`, payload);
  },

  updateMemberRole(groupId, memberId, role) {
    return axiosClient.patch(`/chat-groups/${groupId}/members/${memberId}`, {
      role,
    });
  },

  removeMember(groupId, memberId) {
    return axiosClient.delete(`/chat-groups/${groupId}/members/${memberId}`);
  },

  leaveGroup(groupId, userId) {
    return axiosClient.post(`/chat-groups/${groupId}/leave`, null, {
      params: { userId },
    });
  },

  deleteGroup(groupId) {
    return axiosClient.delete(`/chat-groups/${groupId}`);
  },

  transferLeadership(groupId, newLeaderId) {
    return axiosClient.post(`/chat-groups/${groupId}/transfer-leadership`, {
      newLeaderId,
    });
  },

  updateAvatar(groupId, avatarUrl) {
    return axiosClient.patch(`/chat-groups/${groupId}/avatar`, { avatar: avatarUrl });
  },
};
