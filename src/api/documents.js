import { baseAxios } from "./baseAxios";

export const documents = {
  create: async (type, body) => {
    const { data } = await baseAxios.post(`/api/documents/${type}`, body);

    return data;
  },
};
