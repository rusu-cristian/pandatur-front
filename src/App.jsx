import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { ModalsProvider } from "@mantine/modals";
import { AppProviders } from "@contexts";
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

function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [jwtToken, setJwtToken] = useState(() => Cookies.get("jwt"));

  const publicPaths = publicRoutes.map(({ path }) => path);

  // Слушаем изменения JWT токена
  useEffect(() => {
    const checkToken = () => {
      setJwtToken(Cookies.get("jwt"));
    };

    // Проверяем при монтировании и настраиваем периодическую проверку
    checkToken();
    const interval = setInterval(checkToken, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!jwtToken) {
      if (!pathname.endsWith("/auth"))
        navigate(publicPaths.includes(pathname) ? pathname : "/auth");
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
