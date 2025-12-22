import { baseAxios } from "./baseAxios";

export const users = {
  getById: async (id) => {
    const { data } = await baseAxios.get(`/api/users/${id}`);

    return data;
  },

  getTechnicianList: async () => {
    const { data } = await baseAxios.get("/api/users-technician");

    return data;
  },

  createTechnicianUser: async (body) => {
    const { data } = await baseAxios.post(
      "/api/technician/profile/create",
      body,
    );
    return data;
  },

  getTechnicianById: async (id) => {
    const { data } = await baseAxios.get(`/api/users-technician/${id}`);

    return data;
  },

  updateTechnician: async (id, body) => {
    const { data } = await baseAxios.patch(`/api/users-technician/${id}`, body);

    return data;
  },

  updateMultipleTechnicians: async (body) => {
    const { data } = await baseAxios.patch(
      "/api/users-technician/update-multiple",
      body,
    );
    return data;
  },

  updateUsersGroup: async (body) => {
    const { data } = await baseAxios.post("/api/user-groups/batch-assign", {
      group_id: body.group_id,
      user_ids: body.user_ids,
    });

    return data;
  },

  deleteMultipleUsers: async (body) => {
    const { data } = await baseAxios.delete("/admin/users", { data: body });

    return data;
  },

  updateUser: async (id, body) => {
    const { data } = await baseAxios.patch(`/api/users/${id}`, body);

    return data;
  },

  clientMerge: async (body) => {
    const { data } = await baseAxios.patch("/api/users-client/merge", body);

    return data;
  },

  getUsersClientById: async (id) => {
    const { data } = await baseAxios.get(`/api/users-client/${id}`);

    return data;
  },

  getUsersClientContacts: async (id) => {
    const { data } = await baseAxios.get(`/api/users-client/${id}/contacts`);

    return data;
  },

  getUsersClientContactsByPlatform: async (id) => {
    const { data } = await baseAxios.get(`/api/tickets/${id}/clients-by-platform`);
    return data;
  },

  addClientContact: async (clientId, body) => {
    const { data } = await baseAxios.post(`/api/users-client/${clientId}/contacts`, body);
    return data;
  },

  updateClientContact: async (clientId, contactId, body) => {
    const { data } = await baseAxios.patch(`/api/client-contacts/${contactId}`, body);
    return data;
  },

  deleteClientContact: async (clientId, contactId) => {
    const { data } = await baseAxios.delete(`/api/client-contacts/${contactId}`);
    return data;
  },

  updateClient: async (clientId, body) => {
    const { data } = await baseAxios.patch(`/api/users-client/${clientId}`, body);
    return data;
  },
};
