import React from "react";
import { UserProvider } from "./UserContext";
import { SocketProvider } from "./SocketContext";
import { MessagesProvider } from "./MessagesContext";
import { TicketSyncProvider } from "./TicketSyncContext";
import { UIProvider } from "./UIContext";
import { TicketsProvider } from "./TicketsContext";
import { WebSocketProvider } from "./WebSocketContext";

/**
 * AppProviders — провайдеры для авторизованной части приложения
 * 
 * Порядок провайдеров важен (зависимости сверху вниз):
 * 
 * AuthProvider находится выше в App.jsx (для Login доступа)
 * 
 * 1. UserProvider — данные пользователя (зависит от AuthContext)
 * 2. SocketProvider — WebSocket соединение (подписан на auth events)
 * 3. TicketSyncProvider — Event Bus для синхронизации
 * 4. UIProvider — UI состояние: sidebar, theme
 * 5. TicketsProvider — tickets state и методы
 * 6. WebSocketProvider — обработка WS сообщений
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
