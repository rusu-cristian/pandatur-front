import { createContext, useState, useContext } from "react";

export const FiltersContext = createContext();

/**
 * FiltersContext - Управление фильтрами тикетов
 * 
 * Отвечает за:
 * - Фильтры для Leads (light - kanban)
 * - Фильтры для Chat (filtered tickets)
 * - Состояние активности фильтров
 */
export const FiltersProvider = ({ children }) => {
  // Leads filters (light/kanban)
  const [lightTicketFilters, setLightTicketFilters] = useState({});

  // Chat filters
  const [isChatFiltered, setIsChatFiltered] = useState(false);
  const [currentChatFilters, setCurrentChatFilters] = useState({});

  const resetChatFilters = () => {
    setIsChatFiltered(false);
    setCurrentChatFilters({});
  };

  return (
    <FiltersContext.Provider
      value={{
        // Leads filters
        lightTicketFilters,
        setLightTicketFilters,

        // Chat filters
        isChatFiltered,
        setIsChatFiltered,
        currentChatFilters,
        setCurrentChatFilters,
        resetChatFilters,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return context;
};

