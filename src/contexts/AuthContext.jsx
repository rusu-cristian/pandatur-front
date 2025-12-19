/**
 * AuthContext — единый источник правды для авторизации
 * 
 * Best Practices:
 * - Single Responsibility: только авторизация
 * - Single Source of Truth: isAuthenticated определяет UI
 * - Event Bus для оповещения других контекстов (Socket, etc.)
 * - Нет дублирования логики
 */

import React, { createContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import Cookies from "js-cookie";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "../Components/utils";
import { LoadingOverlay } from "../Components";

// === Event Emitter для синхронизации ===
// Позволяет SocketContext и другим компонентам реагировать мгновенно
const authListeners = new Set();

export const authEvents = {
  subscribe: (callback) => {
    authListeners.add(callback);
    return () => authListeners.delete(callback);
  },
  emit: (event) => {
    authListeners.forEach((cb) => {
      try { cb(event); } catch { /* ignore */ }
    });
  },
};

export const AUTH_EVENTS = {
  LOGOUT: "logout",
  LOGIN: "login",
};

// === Context ===
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState(() => {
    const savedUserId = localStorage.getItem("user_id");
    return savedUserId ? Number(savedUserId) : null;
  });

  const authCheckedRef = useRef(false);

  /**
   * Очистка данных авторизации
   */
  const clearAuthData = useCallback(() => {
    Cookies.remove("jwt");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_surname");
    localStorage.removeItem("user_roles");
    setUserId(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Logout — очищает данные, оповещает подписчиков и делает редирект
   */
  const logout = useCallback(() => {
    clearAuthData();
    authEvents.emit(AUTH_EVENTS.LOGOUT);
    navigate("/auth", { replace: true });
  }, [clearAuthData, navigate]);

  /**
   * Login — сохраняет токен, оповещает подписчиков, делает редирект
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
      localStorage.setItem("user_id", String(newUserId));
    }
    
    setIsAuthenticated(true);
    authEvents.emit(AUTH_EVENTS.LOGIN);
    
    // Редирект на /leads после логина
    navigate("/leads", { replace: true });
  }, [navigate]);

  /**
   * Проверка авторизации при загрузке
   */
  const checkAuth = useCallback(async () => {
    try {
      const data = await api.auth.roles();

      // Проверяем роль пользователя
      if (data.roles?.includes("ROLE_USER")) {
        enqueueSnackbar(getLanguageByKey("accessDenied"), { variant: "error" });
        clearAuthData();
        setAuthLoading(false);
        return;
      }

      // Сохраняем userId
      setUserId(data.user_id);
      localStorage.setItem("user_id", String(data.user_id));
      setIsAuthenticated(true);

      // Если на странице авторизации — редиректим на /leads
      if (location.pathname === "/auth") {
        navigate("/leads", { replace: true });
      }
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
      clearAuthData();
    } finally {
      setAuthLoading(false);
    }
  }, [clearAuthData, navigate, location.pathname]);

  // Проверяем авторизацию один раз при монтировании
  useEffect(() => {
    if (authCheckedRef.current) return;
    authCheckedRef.current = true;
    
    const token = Cookies.get("jwt");
    if (token) {
      checkAuth();
    } else {
      // Нет токена — редирект на /auth (если не на /auth)
      if (location.pathname !== "/auth") {
        navigate("/auth", { replace: true });
      }
      setAuthLoading(false);
    }
  }, [checkAuth, location.pathname, navigate]);

  // Синхронизация между вкладками через storage event
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user_id" && !e.newValue) {
        // Logout в другой вкладке
        clearAuthData();
        navigate("/auth", { replace: true });
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [clearAuthData, navigate]);

  // Проверка токена — защита от удаления токена извне (API interceptor, истечение)
  useEffect(() => {
    // Не проверяем если не авторизован или идёт загрузка
    if (!isAuthenticated || authLoading) return;

    const checkToken = () => {
      const token = Cookies.get("jwt");
      if (!token) {
        // Токен удалён — делаем logout
        clearAuthData();
        authEvents.emit(AUTH_EVENTS.LOGOUT);
        navigate("/auth", { replace: true });
      }
    };

    // Проверяем каждые 5 секунд
    const interval = setInterval(checkToken, 5000);
    
    // Также проверяем при возврате на вкладку
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkToken();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, authLoading, clearAuthData, navigate]);

  const value = useMemo(() => ({
    isAuthenticated,
    authLoading,
    userId,
    login,
    logout,
  }), [isAuthenticated, authLoading, userId, login, logout]);

  // Показываем LoadingOverlay пока идёт проверка авторизации
  if (authLoading) {
    return <LoadingOverlay />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
