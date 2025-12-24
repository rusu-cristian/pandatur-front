/**
 * Ключи, которые всегда должны быть в конце списка (в порядке приоритета)
 * "Altele"/"Alte" идёт перед "Nu e specificat"
 */
const LAST_POSITION_KEYS = [
  "Altele",
  "Alte",
  "Alt motiv",
  "Nu e specificat",
  "Nu este specificat",
];

/**
 * Сортирует опции по алфавиту, но оставляет специальные значения в конце
 * @param {Array<{value: string, label: string}>} options - массив опций
 * @returns {Array<{value: string, label: string}>} - отсортированный массив
 */
export const sortOptionsWithLastItems = (options) => {
  return options.sort((a, b) => {
    const aIsLast = LAST_POSITION_KEYS.includes(a.value);
    const bIsLast = LAST_POSITION_KEYS.includes(b.value);

    // Если оба в конце - сортируем по порядку в LAST_POSITION_KEYS
    if (aIsLast && bIsLast) {
      return LAST_POSITION_KEYS.indexOf(a.value) - LAST_POSITION_KEYS.indexOf(b.value);
    }

    // Если только a в конце - b идёт первым
    if (aIsLast) return 1;

    // Если только b в конце - a идёт первым
    if (bIsLast) return -1;

    // Иначе сортируем по label (переведённому значению)
    return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
  });
};

