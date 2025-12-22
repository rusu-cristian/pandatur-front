import { baseAxios } from "./baseAxios";

export const user = {
  getGroupsList: async () => {
    const { data } = await baseAxios.get("/api/user-groups"); // вот этот
    return data;
  },

  createGroup: async (body) => {
    const { data } = await baseAxios.post("/api/user-groups", body);
    return data;
  },

  updateGroupData: async ({ body }) => {
    const { data } = await baseAxios.patch("/api/user-groups/update", body);
    return data;
  },

  deleteGroups: async (id) => {
    const { data } = await baseAxios.delete(`/api/user-groups/${id}`);
    return data;
  },

  assignTechnicianToGroup: async (groupId, userId) => {
    const { data } = await baseAxios.post(`/api/user-groups/${groupId}/assign/${userId}`);
    return data;
  },

  removeTechnicianFromGroup: async (groupId, userId) => {
    const { data } = await baseAxios.delete(`/api/user-groups/${groupId}/remove/${userId}`);
    return data;
  }
};
