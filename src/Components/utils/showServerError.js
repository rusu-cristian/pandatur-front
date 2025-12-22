import { getLanguageByKey } from "../../Components/utils/getLanguageByKey"

export const showServerError = (error) => {
  const serverMessage = error?.response?.data

  return (
    serverMessage?.message ||
    serverMessage?.error ||
    serverMessage?.detail ||
    getLanguageByKey("Eroare neașteptată, încercați mai târziu")
  )
}
