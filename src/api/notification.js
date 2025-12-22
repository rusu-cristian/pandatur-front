import { baseAxios } from "./baseAxios"

export const notification = {
  create: async (body) => {
    const { data } = await baseAxios.post("/api/notification", body)

    return data
  },

  deleteAllByUserId: async (id) => {
    const { data } = await baseAxios.delete("/api/notification/client", {
      data: {
        client_id: id
      }
    })

    return data
  },

  update: async (body) => {
    const { data } = await baseAxios.patch("/api/notification", body)

    return data
  },

  getById: async (id) => {
    const { data } = await baseAxios.get(`/api/notification/${id}`)

    return data
  }
}
