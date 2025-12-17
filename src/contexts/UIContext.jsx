/**
 * UIContext — контекст для UI состояния приложения
 * 
 * Содержит:
 * - Состояние сайдбара (collapsed)
 * - Тема (в будущем)
 * - Другие UI-related состояния
 */

import { createContext, useContext, useMemo, useCallback } from "react";
import { useLocalStorage } from "@hooks";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const { storage, changeLocalStorage } = useLocalStorage(SIDEBAR_COLLAPSE, "false");
  
  const isCollapsed = storage === "true";
  
  const toggleSidebar = useCallback(() => {
    changeLocalStorage(isCollapsed ? "false" : "true");
  }, [isCollapsed, changeLocalStorage]);

  const setIsCollapsed = useCallback((collapsed) => {
    changeLocalStorage(collapsed ? "true" : "false");
  }, [changeLocalStorage]);

  const value = useMemo(() => ({
    isCollapsed,
    toggleSidebar,
    setIsCollapsed,
  }), [isCollapsed, toggleSidebar, setIsCollapsed]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within UIProvider");
  }
  return context;
};
