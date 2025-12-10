import queryString from "query-string"
import { baseAxios } from "./baseAxios"

export const activity = {
  getLogs: async (params) => {
    const url = queryString.stringifyUrl({
      url: "/api/activity/logs",
      query: params
    })
    const { data } = await baseAxios.get(url)
    return data
  },

  filterLogs: async (body) => {
    const { data } = await baseAxios.post("/api/activity/filter", body)
    return data
  },

  salesMonitor: async (body) => {
    const { data } = await baseAxios.post("/api/stats/sales", body)
    return data
  }
}
