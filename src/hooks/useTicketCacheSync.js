/**
 * useTicketCacheSync — хук для синхронизации React Query кэша с TicketSyncContext
 * 
 * Устраняет дублирование кода в useChatTicketsQuery, useLeadsKanbanQuery, useLeadsTableQuery
 * 
 * @param {Object} options
 * @param {Array} options.queryKey - Ключ кэша React Query
 * @param {Object} options.filters - Текущие фильтры (для проверки соответствия)
 * @param {Function} options.matchFn - Функция проверки соответствия тикета фильтрам
 * @param {string} options.dataPath - Путь к данным: "pages" для infinite query, "tickets" для обычного
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTicketSync, SYNC_EVENTS } from "../contexts/TicketSyncContext";

/**
 * Хук для синхронизации кэша React Query с событиями TicketSync
 */
export const useTicketCacheSync = ({
  queryKey,
  filters = {},
  matchFn = null,
  dataPath = "pages", // "pages" для useInfiniteQuery, "tickets" для useQuery
}) => {
  const queryClient = useQueryClient();
  const { subscribe } = useTicketSync();

  // Храним актуальные значения в ref (чтобы не пересоздавать подписку)
  const queryKeyRef = useRef(queryKey);
  const filtersRef = useRef(filters);
  const matchFnRef = useRef(matchFn);

  queryKeyRef.current = queryKey;
  filtersRef.current = filters;
  matchFnRef.current = matchFn;

  /**
   * Обновляет тикет в кэше infinite query (pages структура)
   */
  const updateInfiniteCache = useCallback((ticketId, ticket, shouldKeep) => {
    queryClient.setQueryData(queryKeyRef.current, (oldData) => {
      if (!oldData?.pages) return oldData;

      const newPages = oldData.pages.map((page) => ({
        ...page,
        tickets: shouldKeep
          // Если соответствует фильтрам — обновляем
          ? page.tickets.map((t) => (t.id === ticketId ? { ...t, ...ticket } : t))
          // Если НЕ соответствует — удаляем
          : page.tickets.filter((t) => t.id !== ticketId),
      }));

      return { ...oldData, pages: newPages };
    });
  }, [queryClient]);

  /**
   * Обновляет тикет в кэше обычного query (tickets структура)
   */
  const updateSimpleCache = useCallback((ticketId, ticket, shouldKeep) => {
    queryClient.setQueryData(queryKeyRef.current, (oldData) => {
      if (!oldData?.tickets) return oldData;

      return {
        ...oldData,
        tickets: shouldKeep
          ? oldData.tickets.map((t) => (t.id === ticketId ? { ...t, ...ticket } : t))
          : oldData.tickets.filter((t) => t.id !== ticketId),
      };
    });
  }, [queryClient]);

  // Подписываемся на события обновления тикетов
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.TICKET_UPDATED, ({ ticketId, ticket }) => {
      if (!ticketId || !ticket) return;

      // Проверяем соответствует ли тикет фильтрам
      const shouldKeep = matchFnRef.current
        ? matchFnRef.current(ticket, filtersRef.current)
        : true; // Если нет функции проверки — всегда обновляем

      // Обновляем кэш в зависимости от структуры данных
      if (dataPath === "pages") {
        updateInfiniteCache(ticketId, ticket, shouldKeep);
      } else {
        updateSimpleCache(ticketId, ticket, shouldKeep);
      }
    });

    return unsubscribe;
  }, [subscribe, dataPath, updateInfiniteCache, updateSimpleCache]);

  return {
    /**
     * Вручную обновить тикет в кэше
     */
    updateTicket: useCallback((ticketId, updates) => {
      if (dataPath === "pages") {
        updateInfiniteCache(ticketId, updates, true);
      } else {
        updateSimpleCache(ticketId, updates, true);
      }
    }, [dataPath, updateInfiniteCache, updateSimpleCache]),

    /**
     * Удалить тикет из кэша
     */
    removeTicket: useCallback((ticketId) => {
      if (dataPath === "pages") {
        updateInfiniteCache(ticketId, {}, false);
      } else {
        updateSimpleCache(ticketId, {}, false);
      }
    }, [dataPath, updateInfiniteCache, updateSimpleCache]),
  };
};
