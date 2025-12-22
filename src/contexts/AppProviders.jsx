import React from "react";
import { UserProvider } from "./UserContext";
import { SocketProvider } from "./SocketContext";
import { AppProvider } from "./AppContext";
import { MessagesProvider } from "./MessagesContext";

/**
 * Единый компонент, объединяющий все кастомные провайдеры приложения
 * Это упрощает структуру App.js и уменьшает вложенность провайдеров
 */
export const AppProviders = ({ children }) => {
  return (
    <UserProvider>
      <SocketProvider>
        <AppProvider>
          <MessagesProvider>
            {children}
          </MessagesProvider>
        </AppProvider>
      </SocketProvider>
    </UserProvider>
  );
};

