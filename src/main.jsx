import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import App from "./App"

// Safari detection - Safari doesn't support CSS zoom properly
// so we need to use transform: scale() instead
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) {
  document.documentElement.classList.add('is-safari');
}

// Создаем QueryClient с оптимальными настройками
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Не перезагружать при возврате на вкладку (можно включить)
      retry: 1, // Повторить запрос 1 раз при ошибке
      staleTime: 5 * 60 * 1000, // Данные считаются свежими 5 минут
      gcTime: 10 * 60 * 1000, // Кэш хранится 10 минут (в React Query v5 переименовано из cacheTime)
    },
    mutations: {
      retry: 0, // Не повторять mutations при ошибке
    },
  },
})

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* DevTools только в dev режиме */}
    {import.meta.env.DEV && (
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    )}
  </QueryClientProvider>
)
