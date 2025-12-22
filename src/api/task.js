import { baseAxios } from "./baseAxios"

export const task = {
  create: async (body) => {
    const { data } = await baseAxios.post("/api/task", body)

    return data
  },

  deleteAll: async (body) => {
    const { data } = await baseAxios.delete("/api/task/clear", { data: body })

    return data
  },

  delete: async (body) => {
    const { data } = await baseAxios.delete("/api/task", { data: body })

    return data
  },

  update: async (body) => {
    const { data } = await baseAxios.patch("/api/task", body)

    return data
  },

  getAllTasks: async (id) => {
    const { data } = await baseAxios.get(`/api/list_tasks`)

    return data
  },

  getTaskByTicket: async (id) => {
    const { data } = await baseAxios.get(`/api/task/ticket/${id}`)

    return data
  },

  filterTasks: async (filters = {}) => {
    const { data } = await baseAxios.post("/api/filter_tasks", filters)

    return data
  }
}
