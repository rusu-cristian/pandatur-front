/**
 * React Query хук для загрузки тикетов в Chat
 * 
 * Заменяет логику fetchChatFilteredTickets из AppContext.
 * URL (через useChatFilters) — единственный источник правды для фильтров.
 * Использует useTicketCacheSync для синхронизации с WebSocket.
 * 
 * ВАЖНО: unreadCount загружается глобально в TicketsContext,
 * этот хук только показывает отфильтрованные тикеты.
 */

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useEffect } from "react";
import { fetchTicketsList, ticketKeys } from "../api/ticketsApi";
import { useChatFilters } from "./useChatFilters";
import { doesTicketMatchFilters, cleanFilters } from "../utils/ticketFilters";
import { useTicketCacheSync } from "./useTicketCacheSync";

/**
 * Хук для загрузки тикетов чата с фильтрами
 * 
 * @returns {Object} - Данные и методы для работы с тикетами
 */
export const useChatTicketsQuery = () => {
  const queryClient = useQueryClient();
  
  // Получаем фильтры из URL (единственный источник правды)
  const { 
    filters: rawFilters, 
    hasFilters, 
    isFiltered, 
    groupTitleForApi,
    workflowOptions,
  } = useChatFilters();

  // Очищаем фильтры от undefined значений для стабильного ключа кэша
  const filters = useMemo(() => cleanFilters(rawFilters), [rawFilters]);

  // Стабильный ключ кэша (JSON.stringify для глубокого сравнения)
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  
  // Ключ кэша зависит от группы и фильтров
  const queryKey = useMemo(
    () => ["tickets", "chat", groupTitleForApi, filtersKey],
    [groupTitleForApi, filtersKey]
  );

  // Infinite Query для загрузки всех страниц
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
    queryFn: async ({ pageParam = 1 }) => {
      const result = await fetchTicketsList({
        page: pageParam,
        groupTitle: groupTitleForApi,
        filters,
        sortBy: "last_interaction_date",
        order: "DESC",
      });

      return {
        ...result,
        nextPage: pageParam < result.pagination.total_pages 
          ? pageParam + 1 
          : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    // Включаем только когда есть все необходимые данные
    enabled: !!groupTitleForApi && workflowOptions.length > 0 && isFiltered && hasFilters,
    // Загружаем все страницы автоматически
    // (можно отключить если список очень большой)
  });

  // Объединяем тикеты из всех страниц в один массив
  const tickets = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.tickets);
  }, [data?.pages]);

  // Сортируем по last_interaction_date (новые сверху)
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const dateA = a.last_interaction_date 
        ? new Date(a.last_interaction_date).getTime() 
        : 0;
      const dateB = b.last_interaction_date 
        ? new Date(b.last_interaction_date).getTime() 
        : 0;
      return dateB - dateA;
    });
  }, [tickets]);

  // Функция для обновления одного тикета в кэше
  const updateTicketInCache = useCallback((ticketId, updater) => {
    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData?.pages) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          tickets: page.tickets.map((ticket) =>
            ticket.id === ticketId 
              ? typeof updater === 'function' ? updater(ticket) : { ...ticket, ...updater }
              : ticket
          ),
        })),
      };
    });
  }, [queryClient, queryKey]);

  // Функция для получения тикета из кэша по ID
  const getTicketById = useCallback((ticketId) => {
    return tickets.find((t) => t.id === ticketId);
  }, [tickets]);

  // Функция для инвалидации кэша (перезагрузки данных)
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ticketKeys.all });
  }, [queryClient]);

  // Автозагрузка всех страниц с защитой от лишних запросов
  useEffect(() => {
    // Загружаем следующую страницу только если:
    // - есть следующая страница
    // - не загружаем сейчас
    // - первая страница уже загружена (data существует)
    if (hasNextPage && !isFetchingNextPage && !isLoading && data?.pages?.length > 0) {
      // Небольшая задержка чтобы не спамить запросами
      const timer = setTimeout(() => {
        fetchNextPage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, data?.pages?.length, fetchNextPage]);

  // Синхронизация кэша с WebSocket через TicketSyncContext
  const { updateTicket, removeTicket } = useTicketCacheSync({
    queryKey,
    filters,
    matchFn: doesTicketMatchFilters,
    dataPath: "pages", // infinite query
  });

  return {
    // Данные
    tickets: sortedTickets,
    totalCount: tickets.length,
    
    // Состояние загрузки
    isLoading,           // Первая загрузка
    isFetching,          // Любая загрузка (включая фоновую)
    isFetchingNextPage,  // Загрузка следующей страницы
    hasNextPage,         // Есть ещё страницы
    error,
    
    // Методы
    fetchNextPage,       // Загрузить следующую страницу
    refetch,             // Перезагрузить всё
    updateTicketInCache, // Обновить тикет в кэше (legacy)
    updateTicket,        // Обновить тикет (из useTicketCacheSync)
    removeTicket,        // Удалить тикет из кэша
    getTicketById,       // Получить тикет по ID
    invalidateCache,     // Инвалидировать кэш
    
    // Фильтры (для удобства)
    filters,
    isFiltered,
    hasFilters,
    groupTitleForApi,
  };
};
