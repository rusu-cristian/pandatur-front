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

// QueryClient БЕЗ кэширования — данные всегда свежие с API
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 0, // Данные всегда "устаревшие"
      gcTime: 0, // Не храним в кэше
    },
    mutations: {
      retry: 0,
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
