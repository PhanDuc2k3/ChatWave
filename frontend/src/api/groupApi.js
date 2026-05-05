import axiosClient from "./axiosClient";

export const groupApi = {
  create(payload) {
    return axiosClient.post("/groups", payload);
  },

  getMyGroups(userId) {
    return axiosClient.get("/groups", { params: { userId } });
  },

  getDiscoverable(userId) {
    return axiosClient.get("/groups/discover", { params: { userId } });
  },

  search(query) {
    return axiosClient.get("/groups/search", { params: { q: query } });
  },

  getById(id) {
    return axiosClient.get(`/groups/${id}`);
  },

  updateVisibility(groupId, visibility, userId) {
    return axiosClient.patch(`/groups/${groupId}/visibility`, {
      visibility,
      userId,
    });
  },

  addMember(groupId, payload) {
    return axiosClient.post(`/groups/${groupId}/members`, payload);
  },

  getJoinRequests(groupId) {
    return axiosClient.get(`/groups/${groupId}/join-requests`);
  },

  getMyJoinRequest(groupId) {
    return axiosClient.get(`/groups/${groupId}/my-join-request`);
  },

  approveJoinRequest(groupId, requestId) {
    return axiosClient.post(
      `/groups/${groupId}/join-requests/${requestId}/approve`
    );
  },

  rejectJoinRequest(groupId, requestId) {
    return axiosClient.post(
      `/groups/${groupId}/join-requests/${requestId}/reject`
    );
  },

  updateMemberRole(groupId, memberId, role) {
    return axiosClient.patch(`/groups/${groupId}/members/${memberId}`, {
      role,
    });
  },

  removeMember(groupId, memberId) {
    return axiosClient.delete(`/groups/${groupId}/members/${memberId}`);
  },

  leaveGroup(groupId) {
    return axiosClient.post(`/groups/${groupId}/leave`);
  },
};

