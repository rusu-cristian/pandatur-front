import { translations } from "./translations";

// Получаем язык один раз при загрузке модуля
const language = localStorage.getItem("language") || "EN";

// Создаём Map с предобработанными переводами для текущего языка
// Это уменьшает время поиска с O(n) до O(1) и экономит память
const translationsCache = new Map();

// Предобрабатываем переводы при первом импорте модуля
(() => {
  for (const key in translations) {
    const value = translations[key]?.[language];
    if (value !== undefined) {
      translationsCache.set(key, value);
    }
  }
})();

/**
 * Получить перевод по ключу
 * Использует предобработанный кэш для быстрого доступа
 * @param {string} key - Ключ перевода
 * @returns {string | undefined} - Перевод или undefined
 */
export const getLanguageByKey = (key) => {
  return translationsCache.get(key);
};

/**
 * Обновить язык (при смене языка пользователем)
 * @param {string} newLanguage - Новый язык (RO, RU, EN)
 */
export const updateLanguage = (newLanguage) => {
  translationsCache.clear();
  for (const key in translations) {
    const value = translations[key]?.[newLanguage];
    if (value !== undefined) {
      translationsCache.set(key, value);
    }
  }
};
