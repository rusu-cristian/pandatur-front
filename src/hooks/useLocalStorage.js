import { useState, useEffect } from "react";

export const useLocalStorage = (key, value) => {
  const [storage, setStorage] = useState(value);

  const changeLocalStorage = (newValue) => {
    setStorage(newValue);
    localStorage.setItem(key, newValue);
  };

  useEffect(() => {
    const storedLanguage = localStorage.getItem(key);
    setStorage(storedLanguage);
  }, []);

  return { storage, changeLocalStorage };
};
