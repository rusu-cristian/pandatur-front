import { useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useApp, useUser } from "@hooks";
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
    fetchChatFilteredTickets,
    setIsChatFiltered,
  } = useApp();
  const { userId } = useUser();
  
  const isInitializedRef = useRef(false);
  const lastFiltersRef = useRef(null);

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

  // Обновить group_title в URL
  const updateGroupTitle = useCallback((newGroupTitle) => {
    const newParams = new URLSearchParams();
    if (newGroupTitle) {
      newParams.set("group_title", newGroupTitle);
    }
    // При смене группы сбрасываем фильтры и ticketId
    navigate(`/chat?${newParams.toString()}`, { replace: true });
  }, [navigate]);

  // === ЭФФЕКТЫ ===

  // Синхронизация group_title при загрузке
  useEffect(() => {
    syncGroupTitleFromUrl();
  }, [syncGroupTitleFromUrl]);

  // Отслеживаем предыдущий groupTitleForApi для определения смены воронки
  const prevGroupTitleRef = useRef(groupTitleForApi);
  const isUpdatingGroupRef = useRef(false);

  // При смене воронки — обновляем URL и сбрасываем фильтры
  useEffect(() => {
    if (!groupTitleForApi || !workflowOptions.length) return;
    
    // Защита от повторных вызовов
    if (isUpdatingGroupRef.current) return;
    
    // Если группа изменилась — обновляем URL с новой группой
    if (prevGroupTitleRef.current && prevGroupTitleRef.current !== groupTitleForApi) {
      isUpdatingGroupRef.current = true;
      
      // Сбрасываем флаги инициализации
      isInitializedRef.current = false;
      lastFiltersRef.current = null;
      
      // Строим дефолтные фильтры для новой воронки
      const EXCLUDED = ["Realizat cu succes", "Închis și nerealizat", "Interesat"];
      const newWorkflows = workflowOptions.filter((w) => !EXCLUDED.includes(w));
      
      const newDefaultFilters = {
        action_needed: true,
        workflow: newWorkflows,
        technician_id: userId ? [String(userId)] : [],
        unseen: "true",
        last_message_author: [0],
      };
      
      // Обновляем URL с новой группой и дефолтными фильтрами
      const urlParams = prepareFiltersForUrl({
        ...newDefaultFilters,
        is_filtered: "true",
        group_title: groupTitleForApi,
      });
      const basePath = ticketId ? `/chat/${ticketId}` : "/chat";
      navigate(`${basePath}?${urlParams.toString()}`, { replace: true });
      
      // Сбрасываем флаг после navigate
      setTimeout(() => {
        isUpdatingGroupRef.current = false;
      }, 100);
    }
    
    prevGroupTitleRef.current = groupTitleForApi;
  }, [groupTitleForApi, workflowOptions, navigate, ticketId, userId]);

  // Загрузка тикетов при изменении фильтров
  useEffect(() => {
    if (!groupTitleForApi || !workflowOptions.length || !userId) return;

    const filtersKey = JSON.stringify({ filters, groupTitleForApi, isFiltered });
    if (lastFiltersRef.current === filtersKey) return;
    lastFiltersRef.current = filtersKey;

    if (isFiltered && hasFilters) {
      // Есть фильтры — загружаем отфильтрованные тикеты
      fetchChatFilteredTickets(filters);
      setIsChatFiltered(true);
    } else if (!isInitializedRef.current) {
      // Первая загрузка без фильтров в URL — применяем дефолтные
      // ВАЖНО: сохраняем ticketId если он есть в URL
      isInitializedRef.current = true;
      const urlParams = prepareFiltersForUrl({
        ...defaultFilters,
        is_filtered: "true",
        ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
      });
      const basePath = ticketId ? `/chat/${ticketId}` : "/chat";
      navigate(`${basePath}?${urlParams.toString()}`, { replace: true });
    }
  }, [
    filters,
    hasFilters,
    isFiltered,
    groupTitleForApi,
    workflowOptions,
    userId,
    fetchChatFilteredTickets,
    setIsChatFiltered,
    defaultFilters,
    navigate,
    ticketId,
  ]);

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
