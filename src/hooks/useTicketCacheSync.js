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
   * Обновляет или добавляет тикет в кэше infinite query (pages структура)
   */
  const updateInfiniteCache = useCallback((ticketId, ticket, shouldKeep) => {
    queryClient.setQueryData(queryKeyRef.current, (oldData) => {
      // Если кэш ещё не инициализирован — пропускаем (данные загрузятся при первом запросе)
      if (!oldData?.pages || oldData.pages.length === 0) return oldData;

      // Проверяем есть ли тикет в кэше
      const ticketExists = oldData.pages.some((page) =>
        page.tickets.some((t) => t.id === ticketId)
      );

      if (!shouldKeep) {
        // Удаляем тикет из всех страниц
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            tickets: page.tickets.filter((t) => t.id !== ticketId),
          })),
        };
      }

      if (ticketExists) {
        // Обновляем существующий тикет
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            tickets: page.tickets.map((t) =>
              t.id === ticketId ? { ...t, ...ticket } : t
            ),
          })),
        };
      }

      // Тикета нет в кэше и он соответствует фильтрам — ДОБАВЛЯЕМ на первую страницу
      // (сортировка по last_interaction_date сделает его в правильном месте)
      const newPages = [...oldData.pages];
      if (newPages.length > 0 && newPages[0].tickets) {
        newPages[0] = {
          ...newPages[0],
          tickets: [ticket, ...newPages[0].tickets],
        };
      }

      return { ...oldData, pages: newPages };
    });
  }, [queryClient]);

  /**
   * Обновляет или добавляет тикет в кэше обычного query (tickets структура)
   */
  const updateSimpleCache = useCallback((ticketId, ticket, shouldKeep) => {
    queryClient.setQueryData(queryKeyRef.current, (oldData) => {
      if (!oldData?.tickets) return oldData;

      const ticketExists = oldData.tickets.some((t) => t.id === ticketId);

      if (!shouldKeep) {
        // Удаляем тикет
        return {
          ...oldData,
          tickets: oldData.tickets.filter((t) => t.id !== ticketId),
        };
      }

      if (ticketExists) {
        // Обновляем существующий
        return {
          ...oldData,
          tickets: oldData.tickets.map((t) =>
            t.id === ticketId ? { ...t, ...ticket } : t
          ),
        };
      }

      // Добавляем новый тикет в начало списка
      return {
        ...oldData,
        tickets: [ticket, ...oldData.tickets],
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
