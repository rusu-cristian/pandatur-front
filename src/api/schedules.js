import { baseAxios } from "./baseAxios"

export const schedules = {
  getSchedules: async () => {
    const { data } = await baseAxios.get("/api/technicians/schedules")
    return data
  },

  addTimeframe: async (payload) => {
    const { data } = await baseAxios.post(
      "/api/technicians/schedule/timeframe",
      payload
    )
    return data
  },

  removeTimeframe: async (payload) => {
    const { data } = await baseAxios.delete(
      "/api/technicians/schedule/timeframe",
      { data: payload }
    )
    return data
  },

  deleteWeekdays: async (payload) => {
    const { data } = await baseAxios.delete(
      "/api/technicians/schedule/weekday",
      { data: payload }
    )
    return data
  },

  getTechnicianSchedule: async (technicianId) => {
    const { data } = await baseAxios.get(
      `/api/technicians/${technicianId}/schedule`
    )
    return data
  },

  updateTechnicianSchedule: async (technicianId, schedule) => {
    const { data } = await baseAxios.post(
      `/api/technicians/${technicianId}/schedule`,
      schedule
    )
    return data
  }
}
