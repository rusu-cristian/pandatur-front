/**
 * AppContext — фасад для обратной совместимости
 * 
 * DEPRECATED: Новый код должен использовать специализированные контексты:
 * - useUI() — для sidebar, theme
 * - useTickets() — для tickets, unreadCount
 * - useTicketSync() — для подписки на обновления тикетов
 * 
 * Этот контекст объединяет данные из новых контекстов для компонентов,
 * которые ещё не мигрированы.
 */

import { createContext, useContext, useMemo } from "react";
import { UserContext } from "./UserContext";
import { useUI } from "./UIContext";
import { useTickets } from "./TicketsContext";
import { useGetTechniciansList } from "../hooks";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Получаем данные из новых контекстов
  const { isCollapsed, setIsCollapsed } = useUI();
  const { 
    tickets,
    setTickets,
    unreadCount,
    setUnreadCount,
    getTicketById,
    getTicketByIdWithFilters,
    fetchSingleTicket,
    markMessagesAsRead,
  } = useTickets();
  
  // Данные из UserContext
  const {
    isAdmin,
    workflowOptions,
    groupTitleForApi,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
    userGroups,
  } = useContext(UserContext);

  // Technicians (отдельный хук)
  const { technicians } = useGetTechniciansList();

  // Объединяем всё в один объект для обратной совместимости
  const value = useMemo(() => ({
    // UI (из UIContext)
    isCollapsed,
    setIsCollapsed,
    
    // Tickets (из TicketsContext)
    tickets,
    setTickets,
    unreadCount,
    setUnreadCount,
    getTicketById,
    getTicketByIdWithFilters,
    fetchSingleTicket,
    markMessagesAsRead,
    
    // User (из UserContext)
    isAdmin,
    workflowOptions,
    groupTitleForApi,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
    userGroups,
    
    // Technicians
    technicians,
  }), [
    isCollapsed,
    setIsCollapsed,
    tickets,
    setTickets,
    unreadCount,
    setUnreadCount,
    getTicketById,
    getTicketByIdWithFilters,
    fetchSingleTicket,
    markMessagesAsRead,
    isAdmin,
    workflowOptions,
    groupTitleForApi,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
    userGroups,
    technicians,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * @deprecated Используйте useUI(), useTickets() напрямую
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
