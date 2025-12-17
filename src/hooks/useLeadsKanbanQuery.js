/**
 * React Query хук для загрузки light тикетов (KANBAN режим)
 * 
 * Заменяет логику useLeadsKanban + глобальные tickets из AppContext.
 * URL (через useLeadsFilters) — единственный источник правды для фильтров.
 */

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useEffect, useState } from "react";
import { useApp } from "./useApp";
import { api } from "../api";
import { getLanguageByKey } from "../Components/utils";
import { getEffectiveWorkflow, EXCLUDED_WORKFLOWS } from "../Components/LeadsComponent/constants";
import { cleanFilters, doesTicketMatchFilters } from "../utils/ticketFilters";

/**
 * Нормализация light тикетов
 */
const normalizeLightTickets = (tickets) =>
  tickets.map((ticket) => ({
    ...ticket,
    last_message: ticket.last_message || getLanguageByKey("no_messages"),
    time_sent: ticket.time_sent || null,
    unseen_count: ticket.unseen_count || 0,
  }));

/**
 * Загрузка одной страницы light тикетов
 */
const fetchLightTicketsPage = async ({
  page,
  groupTitle,
  workflowOptions,
  filters,
  hasFilters,
}) => {
  const { search, group_title, workflow, ...restFilters } = filters;
  const isSearching = !!search?.trim();

  // Эффективный workflow
  const effectiveWorkflow = getEffectiveWorkflow(workflow, workflowOptions, isSearching);

  const response = await api.tickets.filters({
    page,
    type: "light",
    group_title: groupTitle,
    sort_by: "last_interaction_date",
    order: "DESC",
    attributes: {
      ...restFilters,
      workflow: effectiveWorkflow,
      ...(search?.trim() ? { search: search.trim() } : {}),
    },
  });

  return {
    tickets: normalizeLightTickets(response.tickets || []),
    pagination: response.pagination || { page: 1, total_pages: 1 },
  };
};

/**
 * Хук для загрузки light тикетов с бесконечной прокруткой
 * 
 * @param {Object} options
 * @param {Object} options.filters - фильтры из useLeadsFilters
 * @param {boolean} options.hasFilters - есть ли активные фильтры
 * @param {boolean} options.enabled - включить загрузку
 */
export const useLeadsKanbanQuery = ({ 
  filters: rawFilters = {}, 
  hasFilters = false,
  enabled = true 
} = {}) => {
  const queryClient = useQueryClient();
  const { groupTitleForApi, workflowOptions } = useApp();

  // Для подсветки выбранных колонок
  const [choiceWorkflow, setChoiceWorkflow] = useState([]);

  // Очищаем фильтры от undefined значений
  const filters = useMemo(() => cleanFilters(rawFilters), [rawFilters]);
  
  // Стабильный ключ для фильтров
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  // Ключ кэша — включаем hasFilters чтобы отделить "все тикеты" от "отфильтрованные"
  const queryKey = useMemo(
    () => ["tickets", "leads", "light", groupTitleForApi, hasFilters, filtersKey],
    [groupTitleForApi, hasFilters, filtersKey]
  );

  // React Query с бесконечной прокруткой
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      fetchLightTicketsPage({
        page: pageParam,
        groupTitle: groupTitleForApi,
        workflowOptions,
        filters,
        hasFilters,
      }),
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.pagination?.page || 1;
      const totalPages = lastPage.pagination?.total_pages || 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: enabled && !!groupTitleForApi && workflowOptions.length > 0,
    staleTime: 30 * 1000, // 30 секунд
    refetchOnWindowFocus: false,
  });

  // Автозагрузка всех страниц
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;
    if (!data?.pages?.length) return;

    // Небольшая задержка для предотвращения слишком частых запросов
    const timer = setTimeout(() => {
      fetchNextPage();
    }, 100);

    return () => clearTimeout(timer);
  }, [hasNextPage, isFetchingNextPage, isLoading, data?.pages?.length, fetchNextPage]);

  // Объединяем все страницы в один массив
  const tickets = useMemo(() => {
    if (!data?.pages) return [];
    
    const allTickets = data.pages.flatMap((page) => page.tickets);
    
    // Сортируем по last_interaction_date
    return allTickets.sort((a, b) => {
      const dateA = new Date(a.last_interaction_date || 0);
      const dateB = new Date(b.last_interaction_date || 0);
      return dateB - dateA;
    });
  }, [data?.pages]);

  // Синхронизация choiceWorkflow с фильтрами
  useEffect(() => {
    if (hasFilters && filters.workflow) {
      setChoiceWorkflow(Array.isArray(filters.workflow) ? filters.workflow : [filters.workflow]);
    } else if (!hasFilters) {
      setChoiceWorkflow([]);
    }
  }, [hasFilters, filters.workflow]);

  // Инвалидация кэша
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["tickets", "leads", "light"],
    });
  }, [queryClient]);

  // Обновление тикета в кэше
  const updateTicketInCache = useCallback((ticketId, updatedData) => {
    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData?.pages) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          tickets: page.tickets.map((t) =>
            t.id === ticketId ? { ...t, ...updatedData } : t
          ),
        })),
      };
    });
  }, [queryClient, queryKey]);

  // Получение тикета по ID из кэша
  const getTicketById = useCallback((ticketId) => {
    return tickets.find((t) => t.id === ticketId);
  }, [tickets]);

  // Слушаем событие ticketUpdated для синхронизации
  useEffect(() => {
    const handleTicketUpdated = (event) => {
      const { ticketId, ticket } = event.detail || {};
      if (!ticketId || !ticket) return;

      // Проверяем соответствует ли тикет текущим фильтрам
      const matchesFilters = doesTicketMatchFilters(ticket, filters);
      
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData?.pages) return oldData;
        
        const newPages = oldData.pages.map((page) => ({
          ...page,
          tickets: matchesFilters
            ? page.tickets.map((t) => t.id === ticketId ? { ...t, ...ticket } : t)
            : page.tickets.filter((t) => t.id !== ticketId),
        }));
        
        return { ...oldData, pages: newPages };
      });
    };

    window.addEventListener('ticketUpdated', handleTicketUpdated);
    return () => window.removeEventListener('ticketUpdated', handleTicketUpdated);
  }, [queryClient, queryKey, filters]);

  return {
    // Данные
    tickets,
    visibleTickets: tickets, // Алиас для совместимости
    choiceWorkflow,

    // Состояние загрузки
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    error,
    kanbanSpinner: isLoading || isFetchingNextPage, // Совместимость

    // Флаги
    kanbanFilterActive: hasFilters,

    // Действия
    fetchNextPage,
    refetch,
    invalidateCache,
    updateTicketInCache,
    getTicketById,
    setChoiceWorkflow,

    // Для совместимости со старым API
    fetchKanbanTickets: refetch,
    refreshKanbanTickets: refetch,
    currentFetchTickets: refetch,
    resetKanban: invalidateCache,
  };
};
