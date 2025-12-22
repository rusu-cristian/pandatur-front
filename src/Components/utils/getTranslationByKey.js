import { translations } from "./translations"

const language = localStorage.getItem("language") || "RO"

export const getLanguageByKey = (key) => {
  return translations[key]?.[language]
}
