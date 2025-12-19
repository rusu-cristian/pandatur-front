/**
 * AuthContext — контекст для авторизации
 * 
 * Отвечает только за:
 * - Проверку авторизации при загрузке
 * - Login/Logout
 * - Событийную шину для оповещения о logout (без setInterval)
 * 
 * Принцип: Single Responsibility — только авторизация
 */

import React, { createContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import Cookies from "js-cookie";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "../Components/utils";
import { LoadingOverlay } from "../Components";

// === Event Emitter для синхронизации logout ===
// Позволяет SocketContext и другим компонентам реагировать мгновенно без setInterval
const authListeners = new Set();

export const authEvents = {
  subscribe: (callback) => {
    authListeners.add(callback);
    return () => authListeners.delete(callback);
  },
  emit: (event) => {
    authListeners.forEach((cb) => {
      try { cb(event); } catch (e) { /* ignore */ }
    });
  },
};

// === Типы событий ===
export const AUTH_EVENTS = {
  LOGOUT: "logout",
  LOGIN: "login",
};

// === Context ===
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState(() => {
    const savedUserId = localStorage.getItem("user_id");
    return savedUserId ? Number(savedUserId) : null;
  });

  // Флаг для отслеживания, была ли проверка авторизации
  const authCheckedRef = useRef(false);

  // Стабильные ссылки для использования внутри checkAuth
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  /**
   * Logout — очищает токен и оповещает всех подписчиков
   */
  const logout = useCallback(() => {
    Cookies.remove("jwt");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_surname");
    localStorage.removeItem("user_roles");
    
    setUserId(null);
    setIsAuthenticated(false);
    
    // Оповещаем всех подписчиков (SocketContext закроет соединение)
    authEvents.emit(AUTH_EVENTS.LOGOUT);
    
    navigateRef.current("/auth");
  }, []);

  /**
   * Login — сохраняет токен и оповещает подписчиков
   */
  const login = useCallback((token, newUserId) => {
    Cookies.set("jwt", token, {
      secure: window.location.protocol === "https:",
      sameSite: "Lax",
      expires: 1,
      path: "/",
    });
    
    if (newUserId) {
      setUserId(newUserId);
      localStorage.setItem("user_id", newUserId);
    }
    
    setIsAuthenticated(true);
    
    // Оповещаем подписчиков о логине
    authEvents.emit(AUTH_EVENTS.LOGIN);
    
    navigateRef.current("/leads", { replace: true });
  }, []);

  /**
   * Проверка авторизации при загрузке приложения
   */
  const checkAuth = useCallback(async () => {
    try {
      const data = await api.auth.roles();

      // Проверяем роль пользователя
      if (data.roles && data.roles.includes("ROLE_USER")) {
        enqueueSnackbar(getLanguageByKey("accessDenied"), { variant: "error" });
        logout();
        return;
      }

      // Сохраняем userId
      setUserId(data.user_id);
      localStorage.setItem("user_id", data.user_id);
      setIsAuthenticated(true);

      // Навигация
      const currentPathname = window.location.pathname;
      const currentSearch = window.location.search;

      if (currentPathname === "/auth") {
        navigateRef.current("/leads", { replace: true });
      } else {
        // Остаёмся на текущем пути
        navigateRef.current(`${currentPathname}${currentSearch}`, { replace: true });
      }
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
      logout();
    } finally {
      setAuthLoading(false);
    }
  }, [logout]);

  // Проверяем авторизацию ТОЛЬКО ОДИН РАЗ при монтировании
  useEffect(() => {
    if (authCheckedRef.current) return;
    
    const token = Cookies.get("jwt");
    if (token) {
      authCheckedRef.current = true;
      checkAuth();
    } else {
      setAuthLoading(false);
      authCheckedRef.current = true;
    }
  }, [checkAuth]);

  const value = useMemo(() => ({
    // State
    isAuthenticated,
    authLoading,
    userId,
    
    // Methods
    login,
    logout,
    checkAuth,
  }), [isAuthenticated, authLoading, userId, login, logout, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {authLoading ? <LoadingOverlay /> : children}
    </AuthContext.Provider>
  );
};
