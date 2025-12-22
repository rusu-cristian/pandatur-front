import { baseAxios } from "./baseAxios"

export const permissions = {

    createPermissionGroup: async (body) => {
        const { data } = await baseAxios.post("/api/user-groups/permissions", body);
        return data;
    },

    getAllPermissionGroups: async () => {
        const { data } = await baseAxios.get("/api/user-groups/permissions");
        return data;
    },

    deletePermissionGroup: async (id) => {
        const { data } = await baseAxios.delete(`/api/user-groups/permissions/${id}`);
        return data;
    },

    assignPermissionToUser: async (permissionId, userId) => {
        const { data } = await baseAxios.post(`/api/user-groups/permissions/${permissionId}/assign/${userId}`);
        return data;
    },

    updatePermissionGroup: async (id, body) => {
        const { data } = await baseAxios.patch(`/api/user-groups/permissions/${id}`, body);
        return data;
    },

    removePermissionFromTechnician: async (userId) => {
        const { data } = await baseAxios.delete(`/api/user-groups/permissions/technician/${userId}`);
        return data;
    },

    batchAssignPermissionGroup: async (permissionId, userIds) => {
        const { data } = await baseAxios.post(
            `/api/user-groups/permissions/${permissionId}/batch-assign`,
            { user_ids: userIds }
        );
        return data;
    }
}