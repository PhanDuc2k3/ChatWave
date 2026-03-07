import axiosClient from "./axiosClient";

export const groupApi = {
  create(payload) {
    return axiosClient.post("/groups", payload);
  },

  getMyGroups(userId) {
    return axiosClient.get("/groups", { params: { userId } });
  },

  getById(id) {
    return axiosClient.get(`/groups/${id}`);
  },

  addMember(groupId, payload) {
    return axiosClient.post(`/groups/${groupId}/members`, payload);
  },

  updateMemberRole(groupId, memberId, role) {
    return axiosClient.patch(`/groups/${groupId}/members/${memberId}`, {
      role,
    });
  },

  removeMember(groupId, memberId) {
    return axiosClient.delete(`/groups/${groupId}/members/${memberId}`);
  },
};

