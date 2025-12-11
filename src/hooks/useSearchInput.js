import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Хук для управления поисковым input
 * 
 * Поиск выполняется ТОЛЬКО по:
 * - Нажатию Enter
 * - Клику на кнопку поиска
 * - Клику на крестик (очистка)
 * 
 * @param {Object} options
 * @param {string} options.urlValue - Текущее значение из URL (filters.search)
 * @param {Function} options.onSearch - Callback при поиске
 */
export const useSearchInput = ({ urlValue = "", onSearch }) => {
  const [inputValue, setInputValue] = useState(urlValue || "");
  
  // Ref для отслеживания "внутренних" изменений (от пользователя)
  const isUserTypingRef = useRef(false);

  // Синхронизация с URL только при внешних изменениях
  // (сброс фильтров, переход по ссылке и т.д.)
  useEffect(() => {
    // Если пользователь печатает — не перезаписываем
    if (isUserTypingRef.current) {
      isUserTypingRef.current = false;
      return;
    }
    
    const urlVal = urlValue || "";
    if (inputValue !== urlVal) {
      setInputValue(urlVal);
    }
  }, [urlValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ввод текста — только обновляем локальный state
  const handleInputChange = useCallback((e) => {
    isUserTypingRef.current = true;
    setInputValue(e.target.value);
  }, []);

  // Выполнить поиск
  const handleSearch = useCallback(() => {
    const trimmed = inputValue?.trim() || "";
    onSearch(trimmed || undefined);
  }, [inputValue, onSearch]);

  // Поиск по Enter
  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // Очистка поиска
  const handleClear = useCallback(() => {
    setInputValue("");
    onSearch(undefined);
  }, [onSearch]);

  return {
    inputValue,
    setInputValue,
    handleInputChange,
    handleKeyPress,
    handleSearch,
    handleClear,
    hasValue: !!inputValue?.trim(),
  };
};
