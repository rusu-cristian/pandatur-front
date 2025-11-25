import { createContext, useState, useContext } from "react";
import { useLocalStorage } from "@hooks";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";

export const UIContext = createContext();

/**
 * UIContext - Управление UI состоянием приложения
 * 
 * Отвечает за:
 * - Состояние sidebar (collapsed/expanded)
 * - Loading spinners (tickets, chat)
 */
export const UIProvider = ({ children }) => {
  const { storage, changeLocalStorage } = useLocalStorage(SIDEBAR_COLLAPSE, "false");
  const [spinnerTickets, setSpinnerTickets] = useState(false);
  const [chatSpinner, setChatSpinner] = useState(false);

  const collapsed = () => changeLocalStorage(storage === "true" ? "false" : "true");

  return (
    <UIContext.Provider
      value={{
        // Sidebar
        isCollapsed: storage === "true",
        setIsCollapsed: collapsed,
        
        // Spinners
        spinnerTickets,
        setSpinnerTickets,
        chatSpinner,
        setChatSpinner,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

