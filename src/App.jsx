import React, { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { ModalsProvider } from "@mantine/modals";
import { AppProviders } from "@contexts";
import { authEvents, AUTH_EVENTS } from "./contexts/AuthContext";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";
import { AppLayout } from "@layout";
import { PrivateRoutes, PublicRoutes } from "./AppRoutes";
import { MantineProvider } from "./MantineProvider";
import { publicRoutes } from "./routes";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./fonts.css";
import "./colors.css";
import "./App.css";

dayjs.extend(customParseFormat);

/**
 * App компонент — корень приложения
 * 
 * Логика переключения между публичными/приватными маршрутами:
 * - Если есть JWT токен — показываем AppProviders с приватными маршрутами
 * - Если нет токена — показываем публичные маршруты (Login)
 * 
 * События для синхронизации:
 * - authEvents — logout из AuthContext (мгновенная реакция)
 * - storage event — logout из другой вкладки
 * - Проверка cookie — fallback каждую секунду (для логина)
 */
function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [jwtToken, setJwtToken] = useState(() => Cookies.get("jwt"));

  const publicPaths = publicRoutes.map(({ path }) => path);

  // Проверка токена
  const checkToken = useCallback(() => {
    const token = Cookies.get("jwt");
    setJwtToken(token);
  }, []);

  // Подписка на auth события (logout из AuthContext)
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((event) => {
      if (event === AUTH_EVENTS.LOGOUT) {
        setJwtToken(undefined);
      } else if (event === AUTH_EVENTS.LOGIN) {
        checkToken();
      }
    });
    return unsubscribe;
  }, [checkToken]);

  // Подписка на storage events (logout из другой вкладки)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Если user_id удалён — это logout
      if (e.key === "user_id" && !e.newValue) {
        setJwtToken(undefined);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Fallback проверка токена каждую секунду (для обнаружения логина)
  // Используем короткий интервал для быстрой реакции на логин
  useEffect(() => {
    checkToken();
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [checkToken]);

  // Редирект на /auth если нет токена
  useEffect(() => {
    if (!jwtToken) {
      if (!pathname.endsWith("/auth")) {
        navigate(publicPaths.includes(pathname) ? pathname : "/auth");
      }
    }
  }, [navigate, pathname, publicPaths, jwtToken]);

  return (
    <MantineProvider>
      <ModalsProvider>
        <SnackbarProvider
          autoHideDuration={5000}
          maxSnack={5}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          {jwtToken ? (
            <AppProviders>
              <AppLayout>
                <PrivateRoutes />
              </AppLayout>
            </AppProviders>
          ) : (
            <PublicRoutes />
          )}
        </SnackbarProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
