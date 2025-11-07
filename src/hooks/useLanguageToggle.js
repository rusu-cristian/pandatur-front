import { useLocalStorage } from "@hooks";

const LANGUAGE_LOCAL_STORAGE_KEY = "language";

export const LANGUAGES = {
  RO: {
    label: "RO",
    icon: "/flagRO.svg",
  },
  RU: {
    label: "RU",
    icon: "/flagRU.svg",
  },
  EN: {
    label: "EN",
    icon: "/flagEN.svg",
  },
};

export const LANGUAGE_OPTIONS = Object.keys(LANGUAGES).map((key) => ({
  value: key,
  label: LANGUAGES[key].label,
  icon: LANGUAGES[key].icon,
}));

export const useLanguageToggle = () => {
  const { storage, changeLocalStorage } = useLocalStorage(
    LANGUAGE_LOCAL_STORAGE_KEY,
    LANGUAGES.RO.label,
  );

  const setLanguage = (lang) => {
    if (LANGUAGES[lang]) {
      changeLocalStorage(lang);
      window.location.reload();
    }
  };

  return {
    setLanguage,
    selectedLanguage: storage || "EN",
    LANGUAGE_OPTIONS,
    LANGUAGES
  };
};
