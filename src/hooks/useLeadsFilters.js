import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@hooks";
import { parseFiltersFromUrl, prepareFiltersForUrl } from "../Components/utils/parseFiltersFromUrl";
import {
  VIEW_MODE,
  VIEW_MODE_URL,
  REQUEST_TYPE,
  hasRealFilters,
  getEffectiveWorkflow,
} from "../Components/LeadsComponent/constants";

/**
 * Единый хук для управления фильтрами Leads
 * 
 * Принцип: URL — единственный источник правды
 * - Все фильтры читаются из URL
 * - Все изменения фильтров записываются в URL
 * - Нет локального state для фильтров — нет рассинхронизации
 */
export const useLeadsFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { groupTitleForApi, workflowOptions, accessibleGroupTitles, customGroupTitle, setCustomGroupTitle } = useApp();

  // === ЧИТАЕМ ИЗ URL ===
  
  // Текущий режим просмотра (kanban/list)
  const viewMode = useMemo(() => {
    const urlView = searchParams.get("view");
    return urlView?.toUpperCase() === VIEW_MODE.LIST ? VIEW_MODE.LIST : VIEW_MODE.KANBAN;
  }, [searchParams]);

  // Тип запроса (light/hard)
  const requestType = useMemo(() => {
    return viewMode === VIEW_MODE.LIST ? REQUEST_TYPE.HARD : REQUEST_TYPE.LIGHT;
  }, [viewMode]);

  // Парсим фильтры из URL
  const parsedFilters = useMemo(() => {
    return parseFiltersFromUrl(searchParams);
  }, [searchParams]);

  // Фильтры без служебных параметров (для передачи в API)
  const filters = useMemo(() => {
    const { group_title, ...rest } = parsedFilters;
    return rest;
  }, [parsedFilters]);

  // Есть ли активные фильтры (для отображения индикатора)
  const hasFilters = useMemo(() => {
    return hasRealFilters(filters);
  }, [filters]);

  // group_title из URL (для синхронизации с селектором)
  const urlGroupTitle = useMemo(() => {
    return parsedFilters.group_title || null;
  }, [parsedFilters]);

  // Эффективный workflow для запроса (с учётом дефолтов)
  const effectiveWorkflow = useMemo(() => {
    const searchTerm = filters.search?.trim();
    return getEffectiveWorkflow(filters.workflow, workflowOptions, !!searchTerm);
  }, [filters.workflow, filters.search, workflowOptions]);

  // Атрибуты для API запроса (готовые к использованию)
  const apiAttributes = useMemo(() => {
    const { workflow, search, ...restFilters } = filters;
    return {
      ...restFilters,
      workflow: effectiveWorkflow,
      ...(search?.trim() ? { search: search.trim() } : {}),
    };
  }, [filters, effectiveWorkflow]);

  // === ЗАПИСЫВАЕМ В URL ===

  /**
   * Универсальная функция обновления фильтров
   * 
   * - Если значение есть — добавляет/обновляет фильтр
   * - Если значение undefined/null/""/[] — удаляет фильтр
   * 
   * @example
   * updateFilters({ search: "test" })        // Добавить search
   * updateFilters({ search: undefined })     // Удалить search
   * updateFilters({ tags: [], workflow: [] }) // Удалить оба
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
      view: viewMode === VIEW_MODE.LIST ? VIEW_MODE_URL.LIST : VIEW_MODE_URL.KANBAN,
      type: requestType,
      ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
    });
    setSearchParams(urlParams, { replace: true });
  }, [filters, setSearchParams, viewMode, requestType, groupTitleForApi]);

  // Сбросить все фильтры
  const resetFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    newParams.set("view", viewMode === VIEW_MODE.LIST ? VIEW_MODE_URL.LIST : VIEW_MODE_URL.KANBAN);
    newParams.set("type", requestType);
    if (groupTitleForApi) {
      newParams.set("group_title", groupTitleForApi);
    }
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams, viewMode, requestType, groupTitleForApi]);

  // Переключить режим просмотра (kanban/list)
  // Фильтры СОХРАНЯЮТСЯ при переключении
  const setViewMode = useCallback((newMode) => {
    const upperMode = newMode.toUpperCase();
    
    // Берём текущие фильтры и обновляем view/type
    const urlParams = prepareFiltersForUrl({
      ...filters,
      view: upperMode === VIEW_MODE.LIST ? VIEW_MODE_URL.LIST : VIEW_MODE_URL.KANBAN,
      type: upperMode === VIEW_MODE.LIST ? REQUEST_TYPE.HARD : REQUEST_TYPE.LIGHT,
      ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
    });
    
    setSearchParams(urlParams, { replace: true });
  }, [setSearchParams, groupTitleForApi, filters]);

  // Установить поисковый запрос
  const setSearchTerm = useCallback((term) => {
    // updateFilters сам разберётся: если пусто — удалит, если есть значение — добавит
    updateFilters({ search: term?.trim() || undefined });
  }, [updateFilters]);

  // Синхронизация group_title из URL с контекстом
  // Вызывается при первой загрузке страницы с URL содержащим group_title
  const syncGroupTitleFromUrl = useCallback(() => {
    if (
      urlGroupTitle &&
      accessibleGroupTitles.includes(urlGroupTitle) &&
      customGroupTitle !== urlGroupTitle
    ) {
      setCustomGroupTitle(urlGroupTitle);
      return true; // Была синхронизация
    }
    return false; // Синхронизация не нужна
  }, [urlGroupTitle, accessibleGroupTitles, customGroupTitle, setCustomGroupTitle]);

  // Обновить group_title в URL (для смены группы из селектора)
  // Принимает новый group_title напрямую, не зависит от state
  const updateGroupTitle = useCallback((newGroupTitle) => {
    const newParams = new URLSearchParams();
    newParams.set("view", viewMode === VIEW_MODE.LIST ? VIEW_MODE_URL.LIST : VIEW_MODE_URL.KANBAN);
    newParams.set("type", requestType);
    if (newGroupTitle) {
      newParams.set("group_title", newGroupTitle);
    }
    // Сбрасываем фильтры при смене группы
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams, viewMode, requestType]);

  // URL для переключения режимов (с сохранёнными фильтрами)
  const kanbanUrl = useMemo(() => {
    const params = prepareFiltersForUrl({
      ...filters,
      view: VIEW_MODE_URL.KANBAN,
      type: REQUEST_TYPE.LIGHT,
      ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
    });
    return `/leads?${params.toString()}`;
  }, [filters, groupTitleForApi]);

  const listUrl = useMemo(() => {
    const params = prepareFiltersForUrl({
      ...filters,
      view: VIEW_MODE_URL.LIST,
      type: REQUEST_TYPE.HARD,
      ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
    });
    return `/leads?${params.toString()}`;
  }, [filters, groupTitleForApi]);

  return {
    // Состояние (читаем из URL)
    viewMode,
    requestType,
    filters,
    hasFilters,
    effectiveWorkflow,
    apiAttributes,
    urlGroupTitle,
    
    // URL для режимов (progressive enhancement)
    kanbanUrl,
    listUrl,
    
    // Действия (записываем в URL)
    updateFilters,
    resetFilters,
    setViewMode,
    setSearchTerm,
    syncGroupTitleFromUrl,
    updateGroupTitle,
    
    // Вспомогательное
    searchParams,
    groupTitleForApi,
    workflowOptions,
  };
};

