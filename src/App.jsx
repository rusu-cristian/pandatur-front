import React from "react";
import { SnackbarProvider } from "notistack";
import { ModalsProvider } from "@mantine/modals";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";
import { MantineProvider } from "./MantineProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthenticatedApp } from "./AuthenticatedApp";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./fonts.css";
import "./colors.css";
import "./App.css";

dayjs.extend(customParseFormat);

/**
 * App — корневой компонент приложения
 * 
 * Архитектура (Senior React Best Practices):
 * 1. AuthProvider на верхнем уровне — единый источник правды для авторизации
 * 2. AuthenticatedApp решает что показывать (Login или приватные маршруты)
 * 3. Нет дублирования логики — всё через useAuth
 */
function App() {
  return (
    <MantineProvider>
      <ModalsProvider>
        <SnackbarProvider
          autoHideDuration={5000}
          maxSnack={5}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </SnackbarProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
