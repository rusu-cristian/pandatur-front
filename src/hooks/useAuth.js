import { useContext } from "react";
import { AuthContext } from "@contexts";

/**
 * Хук для доступа к AuthContext
 * 
 * Предоставляет:
 * - isAuthenticated — авторизован ли пользователь
 * - userId — ID текущего пользователя
 * - login(token, userId) — вход
 * - logout() — выход
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
