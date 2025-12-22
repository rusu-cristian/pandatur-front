import queryString from "query-string";
import { baseAxios } from "./baseAxios";

export const tickets = {
  list: async () => {
    const { data } = await baseAxios.get("/api/tickets");

    return data;
  },

  getById: async (id) => {
    const { data } = await baseAxios.get(`/api/tickets/${id}`);

    return data;
  },

  updateById: async (body) => {
    const { data } = await baseAxios.patch(`/api/tickets`, body);

    return data;
  },

  createTickets: async (body) => {
    const { data } = await baseAxios.post("/api/tickets", body);

    return data;
  },

  deleteById: async (id) => {
    await baseAxios.delete(`/api/tickets`, {
      data: {
        id,
      },
    });
  },

  merge: async (body) => {
    const { data } = await baseAxios.patch("/api/merge/tickets", body);

    return data;
  },

  getHardList: async (params) => {
    const url = queryString.stringifyUrl({
      url: "/api/hard/tickets",
      query: params,
    });

    const { data } = await baseAxios.get(url);

    return data;
  },

  filters: async (body) => {
    const { data } = await baseAxios.post("/api/tickets/filter", body);

    return data;
  },

  ticket: {
    getInfo: async (id) => {
      const { data } = await baseAxios.get(`/api/ticket-info/${id}`);

      return data;
    },

    create: async (id, body) => {
      const { data } = await baseAxios.post(`/api/ticket-info/${id}`, body);

      return data;
    },

    getLightById: async (id) => {
      const { data } = await baseAxios.get(`/api/light/ticket/${id}`);

      return data;
    },

    uploadMedia: async (body) => {
      const { data } = await baseAxios.post("/ticket-media", body);

      return data;
    },

    getMediaListByTicketId: async (id) => {
      const { data } = await baseAxios.get(`/ticket-media/${id}`);

      return data;
    },

    deleteMediaById: async (id) => {
      const { data } = await baseAxios.delete(`/ticket-media/${id}`);

      return data;
    },

    addClientToTicket: async (body) => {
      const { data } = await baseAxios.post("/api/users-client", body);

      return data;
    },
  }
};
