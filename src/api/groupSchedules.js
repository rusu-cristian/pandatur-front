import { baseAxios } from "./baseAxios"

export const groupSchedules = {
  getAllGroups: async () => {
    const { data } = await baseAxios.get("/api/schedule-groups")
    return data
  },

  createGroup: async (body) => {
    const { data } = await baseAxios.post("/api/schedule-groups", body)
    return data
  },

  getGroupById: async (id) => {
    const { data } = await baseAxios.get(`/api/schedule-groups/${id}`)
    return data
  },

  updateGroup: async (id, body) => {
    const { data } = await baseAxios.patch(`/api/schedule-groups/${id}`, body)
    return data
  },

  deleteGroup: async (id) => {
    await baseAxios.delete(`/api/schedule-groups/${id}`)
  },

  getGroupsByTechnician: async (userId) => {
    const { data } = await baseAxios.get(`/api/schedule-groups/technician/${userId}`)
    return data
  },

  assignMultipleTechnicians: async (groupId, userIds) => {
    const { data } = await baseAxios.post(`/api/schedule-groups/assign`, {
      groupId,
      userIds
    })
    return data
  },

  assignSupervisor: async (groupId, userId) => {
    const { data } = await baseAxios.post(`/api/schedule-groups/${groupId}/supervisor/${userId}`)
    return data
  },

  removeTechnician: async (groupId, userId) => {
    const { data } = await baseAxios.delete(`/api/schedule-groups/${groupId}/remove/${userId}`)
    return data
  },

  getTechniciansInGroup: async (groupId) => {
    const { data } = await baseAxios.get(`/api/schedule-groups/${groupId}/technicians`)
    return data
  }
}
