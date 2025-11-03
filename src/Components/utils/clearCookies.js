import Cookies from "js-cookie"

export const clearCookies = () => {
  Cookies.remove("jwt")
  window.location.reload()
}
