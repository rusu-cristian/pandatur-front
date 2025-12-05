import { baseAxios } from "./baseAxios";
import Cookies from "js-cookie";

export const messages = {
  // Получение сообщений тикета с поддержкой пагинации
  messagesTicketById: async (id, page = 1, limit = 25) => {
    const { data } = await baseAxios.get(`/api/messages/ticket-events/${id}?page=${page}&limit=${limit}`);
    return data;
  },

  upload: async (body) => {
    const { data } = await baseAxios.post("/api/messages/upload", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  notes: {
    create: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/api/ticket/note", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    delete: async (noteId) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.delete(`/api/ticket/note`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { note_id: noteId },
      });
      return data;
    },

    getByTicketId: async (ticketId) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.get(`/api/ticket/${ticketId}/note`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    batchCreate: async (items = []) => {
      const results = [];
      for (const item of items) {
        // eslint-disable-next-line no-await-in-loop
        const res = await messages.notes.create(item);
        results.push(res);
      }
      return results;
    },
  },

  send: {
    create: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    telegram: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send/telegram", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    viber: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send/viber", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    viber_bot: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send/viber-bot", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    whatsapp: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send/whatsapp", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    email: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("/messages/send/email", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },

    markSeen: async (body) => {
      const token = Cookies.get("jwt");
      const { data } = await baseAxios.post("api/messages-seen", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
  },
};
