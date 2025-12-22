import Cookies from "js-cookie"
import { authEvents, AUTH_EVENTS } from "../contexts/AuthContext"

const STATUS_CODE = [401]

export const authInterceptor = (config) => {
  if (!config.headers) config.headers = {}
  const token = Cookies.get("jwt")

  if (token) config.headers["Authorization"] = `Bearer ${token}`

  return config
}

export const responseInterceptor = [
  (res) => res,
  async (err) => {
    if (STATUS_CODE.includes(err?.response?.status)) {
      // Очищаем куки и оповещаем App.jsx о logout
      Cookies.remove("jwt", { path: "/" })
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_name")
      localStorage.removeItem("user_surname")
      localStorage.removeItem("user_roles")
      
      authEvents.emit(AUTH_EVENTS.LOGOUT)
    }

    return Promise.reject(err)
  }
]
