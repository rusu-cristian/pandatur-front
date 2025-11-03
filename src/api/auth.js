import { baseAxios } from "./baseAxios"

export const auth = {
  login: async (body) => {
    const { data } = await baseAxios.post("/api/login", body)

    return data
  },

  register: async (body) => {
    const { data } = await baseAxios.post("/api/register", body)

    return data
  },

  session: async () => {
    const { data } = await baseAxios.get("/api/session")

    return data
  },

  logout: async () => {
    await baseAxios.post("/api/logout")
  }
}
