import { createContext } from "react";

/**
 * @deprecated
 * Этот контекст больше не используется.
 * Весь функционал был разделён на специализированные контексты:
 * - UIContext (spinners, sidebar) - используй useUI()
 * - FiltersContext (фильтры) - используй useFilters()
 * - TicketsContext (тикеты, WebSocket) - используй useTickets()
 * - UserContext (пользователь, роли) - используй useUser()
 * 
 * Этот файл оставлен только для обратной совместимости
 * и будет полностью удалён в следующем релизе.
 */
export const AppContext = createContext();

/**
 * @deprecated Пустая оболочка для обратной совместимости
 */
export const AppProvider = ({ children }) => {
  return (
    <AppContext.Provider value={{}}>
      {children}
    </AppContext.Provider>
  );
};
