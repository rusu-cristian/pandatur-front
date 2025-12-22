import { translations } from "./translations"

const language = localStorage.getItem("language") || "EN"

export const getLanguageByKey = (key) => {
  return translations[key]?.[language]
}
