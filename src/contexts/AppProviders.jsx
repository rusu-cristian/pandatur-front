import React from "react";
import { UserProvider } from "./UserContext";
import { SocketProvider } from "./SocketContext";
import { MessagesProvider } from "./MessagesContext";
import { TicketSyncProvider } from "./TicketSyncContext";
import { UIProvider } from "./UIContext";
import { TicketsProvider } from "./TicketsContext";
import { WebSocketProvider } from "./WebSocketContext";

/**
 * Единый компонент, объединяющий все кастомные провайдеры приложения
 * 
 * Порядок провайдеров важен:
 * 1. UserProvider — данные пользователя (используется везде)
 * 2. SocketProvider — WebSocket соединение
 * 3. TicketSyncProvider — шина событий для синхронизации
 * 4. UIProvider — UI состояние (sidebar, theme)
 * 5. TicketsProvider — tickets state и методы
 * 6. WebSocketProvider — обработка WebSocket сообщений
 * 7. MessagesProvider — сообщения в чате
 */
export const AppProviders = ({ children }) => {
  return (
    <UserProvider>
      <SocketProvider>
        <TicketSyncProvider>
          <UIProvider>
            <TicketsProvider>
              <WebSocketProvider>
          <MessagesProvider>
            {children}
          </MessagesProvider>
              </WebSocketProvider>
            </TicketsProvider>
          </UIProvider>
        </TicketSyncProvider>
      </SocketProvider>
    </UserProvider>
  );
};

