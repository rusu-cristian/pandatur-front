/**
 * TicketsContext — контекст для работы с тикетами
 * 
 * Содержит:
 * - tickets state (для SingleChat и legacy компонентов)
 * - unreadCount
 * - ticketsMap (Hash Map для O(1) поиска)
 * - fetchSingleTicket
 * - markMessagesAsRead
 */

import { createContext, useState, useRef, useContext, useCallback, useMemo, useEffect } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";
import { normalizeLightTickets } from "../utils/ticketNormalizers";
import { useTicketSync } from "./TicketSyncContext";
import { UserContext } from "./UserContext";

const TicketsContext = createContext(null);

export const TicketsProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { notifyTicketUpdated } = useTicketSync();
  
  const {
    groupTitleForApi,
    accessibleGroupTitles,
  } = useContext(UserContext);

  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Hash map для быстрого доступа к тикетам по ID
  const ticketsMap = useRef(new Map());

  // Синхронизируем ticketsMap с tickets через useEffect
  // Это гарантирует что Map всегда актуален после рендера
  useEffect(() => {
    ticketsMap.current.clear();
    tickets.forEach(ticket => {
      ticketsMap.current.set(ticket.id, ticket);
    });
  }, [tickets]);

  // Получить тикет по ID из Hash Map (O(1))
  const getTicketById = useCallback((ticketId) => {
    return ticketsMap.current.get(ticketId);
  }, []);

  // Универсальная функция для получения тикета (для совместимости)
  const getTicketByIdWithFilters = useCallback((ticketId, isFiltered) => {
    return getTicketById(ticketId);
  }, [getTicketById]);

  /**
   * Загрузить и обновить один тикет
   */
  const fetchSingleTicket = useCallback(async (ticketId) => {
    try {
      const ticket = await api.tickets.ticket.getLightById(ticketId);
      const normalizedTicket = normalizeLightTickets([ticket])[0];

      // Проверяем группу тикета
      const isMatchingGroup = normalizedTicket.group_title === groupTitleForApi;

      if (!isMatchingGroup) {
        const hasAccessToTicketGroup = accessibleGroupTitles.includes(normalizedTicket.group_title);

        if (!hasAccessToTicketGroup) {
          // Пользователь НЕ имеет доступа — удаляем из списков
          const existingTicket = getTicketById(ticketId);

          if (existingTicket) {
            if (existingTicket.unseen_count > 0) {
              setUnreadCount((prev) => Math.max(0, prev - existingTicket.unseen_count));
            }
            ticketsMap.current.delete(ticketId);
            setTickets((prev) => prev.filter((t) => t.id !== ticketId));
          }
          
          // Оповещаем через TicketSync (React Query хуки подхватят)
          notifyTicketUpdated(ticketId, normalizedTicket);
          return;
        }

        // Есть доступ, но другая группа — только оповещаем
        notifyTicketUpdated(ticketId, normalizedTicket);
        return normalizedTicket;
      }

      // Группа совпадает — обновляем state
      const existingTicket = getTicketById(ticketId);
      const oldUnseenCount = existingTicket?.unseen_count || 0;
      const newUnseenCount = normalizedTicket.unseen_count || 0;

      // Обновляем tickets state (ticketsMap синхронизируется автоматически через useEffect)
      setTickets((prev) => {
        const exists = prev.find((t) => t.id === ticketId);
        if (exists) {
          return prev.map((t) => (t.id === ticketId ? normalizedTicket : t));
        } else {
          return [...prev, normalizedTicket];
        }
      });

      // Пересчитываем unreadCount
      const diff = newUnseenCount - oldUnseenCount;
      if (diff !== 0) {
        setUnreadCount((prev) => Math.max(0, prev + diff));
      }

      // Оповещаем через TicketSync
      notifyTicketUpdated(ticketId, normalizedTicket);
      
      return normalizedTicket;
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "warning" });
    }
  }, [groupTitleForApi, accessibleGroupTitles, enqueueSnackbar, getTicketById, notifyTicketUpdated]);

  /**
   * Пометить сообщения как прочитанные
   */
  const markMessagesAsRead = useCallback(async (ticketId, count = 0) => {
    if (!ticketId) return;
    await fetchSingleTicket(ticketId);
  }, [fetchSingleTicket]);

  /**
   * Удалить тикет из state
   */
  const removeTicket = useCallback((ticketId) => {
    const ticket = getTicketById(ticketId);
    
    if (ticket?.unseen_count > 0) {
      setUnreadCount((prev) => Math.max(0, prev - ticket.unseen_count));
    }
    
    // ticketsMap синхронизируется автоматически через useEffect
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  }, [getTicketById]);

  /**
   * Обновить тикет в state (без API запроса)
   */
  const updateTicketInState = useCallback((ticketId, updates) => {
    // ticketsMap синхронизируется автоматически через useEffect
    setTickets((prev) => {
      const exists = prev.find((t) => t.id === ticketId);
      if (!exists) return prev;

      const updated = { ...exists, ...updates };
      return prev.map((t) => (t.id === ticketId ? updated : t));
    });
  }, []);

  const value = useMemo(() => ({
    // State
    tickets,
    setTickets,
    unreadCount,
    setUnreadCount,
    
    // Методы
    getTicketById,
    getTicketByIdWithFilters,
    fetchSingleTicket,
    markMessagesAsRead,
    removeTicket,
    updateTicketInState,
    
    // Внутренние (для WebSocket) — ticketsMap синхронизируется автоматически
    ticketsMap,
  }), [
    tickets, 
    unreadCount, 
    getTicketById, 
    getTicketByIdWithFilters, 
    fetchSingleTicket, 
    markMessagesAsRead,
    removeTicket,
    updateTicketInState,
  ]);

  return (
    <TicketsContext.Provider value={value}>
      {children}
    </TicketsContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error("useTickets must be used within TicketsProvider");
  }
  return context;
};
