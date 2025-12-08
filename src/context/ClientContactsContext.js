import React, { createContext, useContext } from "react";
import { useClientContacts } from "../hooks/useClientContacts";

const ClientContactsContext = createContext(null);

export const ClientContactsProvider = ({ ticketId, lastMessage, groupTitle, children }) => {
  const clientContactsData = useClientContacts(ticketId, lastMessage, groupTitle);

  return (
    <ClientContactsContext.Provider value={clientContactsData}>
      {children}
    </ClientContactsContext.Provider>
  );
};

export const useClientContactsContext = () => {
  const context = useContext(ClientContactsContext);
  if (!context) {
    throw new Error("useClientContactsContext must be used within ClientContactsProvider");
  }
  return context;
};
