import Cookies from "js-cookie"

export const clearCookies = () => {
  Cookies.remove("jwt", { path: "/" })
  window.location.reload()
}
