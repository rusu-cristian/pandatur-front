import React from "react";
import { UserProvider } from "./UserContext";
import { SocketProvider } from "./SocketContext";
import { AppProvider } from "./AppContext";
import { MessagesProvider } from "./MessagesContext";
import { UIProvider } from "./UIContext";
import { FiltersProvider } from "./FiltersContext";
import { TicketsProvider } from "./TicketsContext";

/**
 * Единый компонент, объединяющий все кастомные провайдеры приложения
 * Это упрощает структуру App.js и уменьшает вложенность провайдеров
 * 
 * Порядок важен:
 * 1. UserProvider - предоставляет данные пользователя
 * 2. SocketProvider - подключается к WebSocket
 * 3. UIProvider - управляет UI состоянием
 * 4. FiltersProvider - управляет фильтрами
 * 5. TicketsProvider - управляет тикетами (зависит от Filters)
 * 6. AppProvider - старый контекст (постепенно удалим)
 * 7. MessagesProvider - управляет сообщениями
 */
export const AppProviders = ({ children }) => {
  return (
    <UserProvider>
      <SocketProvider>
        <UIProvider>
          <FiltersProvider>
            <TicketsProvider>
              <AppProvider>
                <MessagesProvider>
                  {children}
                </MessagesProvider>
              </AppProvider>
            </TicketsProvider>
          </FiltersProvider>
        </UIProvider>
      </SocketProvider>
    </UserProvider>
  );
};

