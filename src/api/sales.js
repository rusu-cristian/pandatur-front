import { baseAxios } from "./baseAxios";

export const sales = {
  getSalesStats: async (body) => {
    const { data } = await baseAxios.post("/api/stats/sales", body);
    return data;
  },
};
