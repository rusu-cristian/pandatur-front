/**
 * UIContext — контекст для UI состояния приложения
 * 
 * Содержит:
 * - Состояние сайдбара (collapsed)
 * - Тема (в будущем)
 * - Другие UI-related состояния
 */

import { createContext, useContext, useMemo, useCallback, useRef } from "react";
import { useLocalStorage } from "@hooks";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const { storage, changeLocalStorage } = useLocalStorage(SIDEBAR_COLLAPSE, "false");
  
  const isCollapsed = storage === "true";
  
  // Храним актуальное значение в ref для использования в setIsCollapsed
  const isCollapsedRef = useRef(isCollapsed);
  isCollapsedRef.current = isCollapsed;
  
  const toggleSidebar = useCallback(() => {
    changeLocalStorage(isCollapsedRef.current ? "false" : "true");
  }, [changeLocalStorage]);

  /**
   * setIsCollapsed поддерживает два варианта вызова:
   * - setIsCollapsed(true/false) — прямое значение
   * - setIsCollapsed((prev) => !prev) — функциональный апдейт (как useState)
   */
  const setIsCollapsed = useCallback((collapsedOrUpdater) => {
    let newValue;
    
    if (typeof collapsedOrUpdater === "function") {
      // Функциональный апдейт: (prev) => newValue
      newValue = collapsedOrUpdater(isCollapsedRef.current);
    } else {
      // Прямое значение
      newValue = collapsedOrUpdater;
    }
    
    changeLocalStorage(newValue ? "true" : "false");
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
