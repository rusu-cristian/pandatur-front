// Все доступные номера панды
export const PANDA_NUMBERS = [
  { value: "37360991919", label: "37360991919 - Panda Tur Moldova", platforms: ["whatsapp", "viber", "telegram"] },
  { value: "37369440400", label: "37369440400 - Panda Tur Moldova", platforms: ["whatsapp"] },
  { value: "40720949119", label: "40720949119 - Panda Tur Iasi (Romania)", platforms: ["whatsapp"] },
  { value: "40728932931", label: "40728932931 - Panda Tur Bucuresti (Romania)", platforms: ["whatsapp"] },
  { value: "40721205105", label: "40721205105 - Panda Tur Brasov (Romania)", platforms: ["whatsapp"] },
];

/**
 * Фильтрует номера панды по воронке (group_title) и платформе
 * @param {string} groupTitle - Название воронки
 * @param {string} platform - Платформа (whatsapp, viber, telegram)
 * @returns {Array} Отфильтрованный массив номеров панды
 */
export const getPandaNumbersByGroupTitle = (groupTitle, platform = 'whatsapp') => {
  if (!groupTitle) {
    // Для всех остальных случаев - показать все номера для данной платформы
    return PANDA_NUMBERS.filter(num => num.platforms.includes(platform));
  }

  const groupTitleUpper = groupTitle.toUpperCase();
  const normalizedPlatform = platform.toLowerCase();

  // Для MD воронки - показать только MD номера для данной платформы
  if (groupTitleUpper.includes('MD') || groupTitleUpper.includes('RASCANI')) {
    return PANDA_NUMBERS.filter(num =>
      num.value.startsWith("373") && num.platforms.includes(normalizedPlatform)
    );
  }

  if (groupTitleUpper.includes('RO')) {
    // Для RO воронки - показать только RO номера для данной платформы
    return PANDA_NUMBERS.filter(num =>
      !num.value.startsWith("373") && num.platforms.includes(normalizedPlatform)
    );
  }

  // Для всех остальных случаев - показать все номера для данной платформы
  return PANDA_NUMBERS.filter(num => num.platforms.includes(normalizedPlatform));
};

/**
 * Получает MD номера панды для конкретной платформы
 * @param {string} platform - Платформа (whatsapp, viber, telegram)
 * @returns {Array} Массив MD номеров панды для данной платформы
 */
export const getMDPandaNumbers = (platform = 'whatsapp') => {
  const normalizedPlatform = platform.toLowerCase();
  return PANDA_NUMBERS.filter(num =>
    num.value.startsWith("373") && num.platforms.includes(normalizedPlatform)
  );
};

/**
 * Получает все RO номера панды для конкретной платформы
 * @param {string} platform - Платформа (whatsapp, viber, telegram)
 * @returns {Array} Массив RO номеров панды для данной платформы
 */
export const getROPandaNumbers = (platform = 'whatsapp') => {
  const normalizedPlatform = platform.toLowerCase();
  return PANDA_NUMBERS.filter(num =>
    !num.value.startsWith("373") && num.platforms.includes(normalizedPlatform)
  );
};

/**
 * Проверяет, является ли номер MD номером
 * @param {string} number - Номер для проверки
 * @returns {boolean} true если это MD номер
 */
export const isMDPandaNumber = (number) => {
  return number && number.startsWith("373");
};

/**
 * Проверяет, является ли номер RO номером
 * @param {string} number - Номер для проверки
 * @returns {boolean} true если это RO номер
 */
export const isROPandaNumber = (number) => {
  return number && !number.startsWith("373") && PANDA_NUMBERS.some(num => num.value === number);
};
