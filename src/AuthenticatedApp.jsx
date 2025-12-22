import React from "react";
import { AppProviders } from "@contexts";
import { AppLayout } from "@layout";
import { PrivateRoutes, PublicRoutes } from "./AppRoutes";
import { useAuth } from "./hooks/useAuth";

/**
 * AuthenticatedApp — решает что показывать в зависимости от авторизации
 * 
 * Использует useAuth (Single Source of Truth):
 * - isAuthenticated = true → AppProviders + PrivateRoutes
 * - isAuthenticated = false → PublicRoutes (Login)
 * 
 * AuthProvider показывает LoadingOverlay пока идёт проверка авторизации,
 * поэтому здесь не нужно обрабатывать loading state.
 */
export const AuthenticatedApp = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <AppProviders>
        <AppLayout>
          <PrivateRoutes />
        </AppLayout>
      </AppProviders>
    );
  }

  return <PublicRoutes />;
};
