/**
 * Константы для модуля Leads
 * Централизованное место для всех констант — легко поддерживать
 */

// Режимы отображения
export const VIEW_MODE = {
  KANBAN: "KANBAN",
  LIST: "LIST",
};

// URL значения для view (lowercase)
export const VIEW_MODE_URL = {
  KANBAN: "kanban",
  LIST: "list",
};

// Типы запросов к API
export const REQUEST_TYPE = {
  LIGHT: "light",
  HARD: "hard",
};

// Финальные (закрытые) статусы workflow — исключаются по умолчанию
export const EXCLUDED_WORKFLOWS = [
  "Realizat cu succes",
  "Închis și nerealizat",
];

// Параметры URL которые НЕ являются фильтрами
export const NON_FILTER_PARAMS = ["view", "type", "group_title"];

// Дефолтные значения пагинации
export const DEFAULT_PER_PAGE = 50;
export const DEFAULT_PAGE = 1;

/**
 * Проверяет, есть ли реальные фильтры в объекте
 * @param {Object} filters - объект фильтров
 * @returns {boolean}
 */
export const hasRealFilters = (filters) => {
  if (!filters || typeof filters !== "object") return false;
  
  return Object.entries(filters).some(([key, value]) => {
    // Пропускаем служебные параметры
    if (NON_FILTER_PARAMS.includes(key)) return false;
    
    // Проверяем что значение не пустое
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    
    return true;
  });
};

/**
 * Получает эффективный workflow для запроса
 * @param {Array} selectedWorkflow - выбранные в фильтре workflow
 * @param {Array} allWorkflowOptions - все доступные workflow
 * @param {boolean} isSearching - есть ли активный поиск
 * @returns {Array}
 */
export const getEffectiveWorkflow = (selectedWorkflow, allWorkflowOptions, isSearching = false) => {
  // Если workflow явно выбран в фильтре — используем его
  if (Array.isArray(selectedWorkflow) && selectedWorkflow.length > 0) {
    return selectedWorkflow;
  }
  
  // Если поиск — ищем по всем workflow (чтобы найти везде)
  if (isSearching) {
    return allWorkflowOptions;
  }
  
  // По умолчанию — все workflow без закрытых статусов
  return allWorkflowOptions.filter((w) => !EXCLUDED_WORKFLOWS.includes(w));
};

