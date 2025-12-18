import { useCallback, useMemo, useContext } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@hooks";
import { UserContext } from "../contexts/UserContext";
import { parseFiltersFromUrl, prepareFiltersForUrl } from "../Components/utils/parseFiltersFromUrl";

// Финальные статусы, которые исключаем из показа в чате
const EXCLUDED_WORKFLOWS = ["Realizat cu succes", "Închis și nerealizat", "Interesat"];

/**
 * Проверяет есть ли реальные фильтры (не считая служебные параметры)
 */
const hasRealFilters = (filters) => {
  const { group_title, is_filtered, ...realFilters } = filters;
  return Object.values(realFilters).some(
    (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
  );
};

/**
 * Единый хук для управления фильтрами Chat
 * 
 * Принцип: URL — единственный источник правды
 * - Все фильтры читаются из URL
 * - Все изменения фильтров записываются в URL
 * 
 * ВАЖНО: Этот хук НЕ содержит эффектов загрузки данных!
 * Загрузка происходит в ChatList.jsx (как в useLeadsFilters + Leads.jsx)
 */
export const useChatFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ticketId } = useParams(); // Получаем ticketId из path
  
  const { 
    groupTitleForApi, 
    workflowOptions, 
    accessibleGroupTitles, 
    customGroupTitle, 
    setCustomGroupTitle,
  } = useContext(UserContext);
  const { userId } = useUser();

  // === ДЕФОЛТНЫЕ ФИЛЬТРЫ ДЛЯ ЧАТА ===
  const defaultFilters = useMemo(() => {
    const filteredWorkflow = workflowOptions.filter((w) => !EXCLUDED_WORKFLOWS.includes(w));
    return {
      action_needed: true,
      workflow: filteredWorkflow,
      technician_id: userId ? [String(userId)] : [],
      unseen: "true",
      last_message_author: [0],
    };
  }, [workflowOptions, userId]);

  // === ЧИТАЕМ ИЗ URL ===

  // Парсим фильтры из URL
  const parsedFilters = useMemo(() => {
    return parseFiltersFromUrl(searchParams);
  }, [searchParams]);

  // Фильтры без служебных параметров
  const filters = useMemo(() => {
    const { group_title, is_filtered, ...rest } = parsedFilters;
    return rest;
  }, [parsedFilters]);

  // Есть ли активные фильтры
  const hasFilters = useMemo(() => {
    return hasRealFilters(filters);
  }, [filters]);

  // is_filtered флаг из URL
  const isFiltered = useMemo(() => {
    return searchParams.get("is_filtered") === "true";
  }, [searchParams]);

  // group_title из URL
  const urlGroupTitle = useMemo(() => {
    return parsedFilters.group_title || null;
  }, [parsedFilters]);

  // === ЗАПИСЫВАЕМ В URL ===

  /**
   * Частичное обновление фильтров (merge с существующими)
   * Используй для изменения одного-двух параметров
   */
  const updateFilters = useCallback((partialFilters) => {
    const newFilters = { ...filters };

    Object.entries(partialFilters).forEach(([key, value]) => {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
    });

    const urlParams = prepareFiltersForUrl({
      ...newFilters,
      is_filtered: "true",
      ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
    });
    
    // Переходим на /chat без ticketId, но с новыми фильтрами
    navigate(`/chat?${urlParams.toString()}`, { replace: true });
  }, [filters, navigate, groupTitleForApi]);

  /**
   * Полная замена фильтров (для формы фильтра)
   * Используй когда нужно установить ВСЕ фильтры из формы
   */
  const setFilters = useCallback((newFilters) => {
    const urlParams = prepareFiltersForUrl({
      ...newFilters,
      is_filtered: "true",
      ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
    });
    
    navigate(`/chat?${urlParams.toString()}`, { replace: true });
  }, [navigate, groupTitleForApi]);

  /**
   * Сбросить к дефолтным фильтрам
   * ВАЖНО: При сбросе фильтров сбрасываем ticketId (переходим на /chat)
   */
  const resetFilters = useCallback(() => {
    const urlParams = prepareFiltersForUrl({
      ...defaultFilters,
      is_filtered: "true",
      ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
    });
    // Переходим на /chat без ticketId
    navigate(`/chat?${urlParams.toString()}`, { replace: true });
  }, [defaultFilters, navigate, groupTitleForApi]);

  /**
   * Полностью очистить фильтры (убрать is_filtered)
   */
  const clearFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    if (groupTitleForApi) {
      newParams.set("group_title", groupTitleForApi);
    }
    // Переходим на /chat без ticketId
    navigate(`/chat?${newParams.toString()}`, { replace: true });
  }, [navigate, groupTitleForApi]);

  // Синхронизация group_title из URL с контекстом
  const syncGroupTitleFromUrl = useCallback(() => {
    if (
      urlGroupTitle &&
      accessibleGroupTitles.includes(urlGroupTitle) &&
      customGroupTitle !== urlGroupTitle
    ) {
      setCustomGroupTitle(urlGroupTitle);
      return true;
    }
    return false;
  }, [urlGroupTitle, accessibleGroupTitles, customGroupTitle, setCustomGroupTitle]);

  // Обновить group_title — обновляет контекст и сбрасывает URL
  const updateGroupTitle = useCallback((newGroupTitle) => {
    // 1. Обновляем контекст
    if (newGroupTitle && accessibleGroupTitles.includes(newGroupTitle)) {
      setCustomGroupTitle(newGroupTitle);
      localStorage.setItem("leads_last_group_title", newGroupTitle);
    } else {
      setCustomGroupTitle(null);
      localStorage.removeItem("leads_last_group_title");
    }
    
    // 2. Сбрасываем URL — убираем все фильтры, оставляем только group_title
    // ChatList подхватит изменение и применит дефолтные фильтры
    const newParams = new URLSearchParams();
    if (newGroupTitle) {
      newParams.set("group_title", newGroupTitle);
    }
    
    // При смене группы сбрасываем фильтры и ticketId
    navigate(`/chat?${newParams.toString()}`, { replace: true });
  }, [navigate, accessibleGroupTitles, setCustomGroupTitle]);

  // === ЭФФЕКТЫ ===
  // ВАЖНО: Эффект загрузки тикетов УБРАН из хука!
  // Загрузка происходит в ChatList.jsx (как в Leads — useLeadsFilters тоже без загрузки)
  // Это предотвращает повторную загрузку при открытии ChatFilter

  return {
    // Состояние
    filters,
    hasFilters,
    isFiltered,
    defaultFilters,
    urlGroupTitle,
    ticketId, // ticketId из URL path
    
    // Действия
    setFilters,      // Полная замена (для формы)
    updateFilters,   // Частичное обновление (для отдельных полей)
    resetFilters,
    clearFilters,
    syncGroupTitleFromUrl,
    updateGroupTitle,
    
    // Вспомогательное
    groupTitleForApi,
    workflowOptions,
  };
};
