import React from "react";
import { AuthProvider } from "./AuthContext";
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
 * Порядок провайдеров важен (зависимости сверху вниз):
 * 
 * 1. AuthProvider — авторизация (базовый, без зависимостей)
 * 2. UserProvider — данные пользователя (зависит от AuthContext)
 * 3. SocketProvider — WebSocket соединение (подписывается на auth события)
 * 4. TicketSyncProvider — Event Bus для синхронизации (независим)
 * 5. UIProvider — UI состояние: sidebar, theme (независим)
 * 6. TicketsProvider — tickets state и методы (зависит от User, TicketSync)
 * 7. WebSocketProvider — обработка WS сообщений (зависит от Socket, Tickets, User)
 * 8. MessagesProvider — сообщения в чате (зависит от всего выше)
 */
export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
};
