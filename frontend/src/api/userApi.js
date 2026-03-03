import axiosClient from "./axiosClient";

export const userApi = {
    getById(id) {
        return axiosClient.get(`/users/${id}`);
    },
};

