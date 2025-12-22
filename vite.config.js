import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // PurgeCSS отключён — слишком агрессивно удаляет стили сторонних библиотек
    // (react-pro-sidebar, MUI, react-select и др.)
  ],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "src/Components"),
      "@utils": path.resolve(__dirname, "src/Components/utils"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@contexts": path.resolve(__dirname, "src/contexts"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@layout": path.resolve(__dirname, "src/layout"),
      "@api": path.resolve(__dirname, "src/api"),
      "@app-constants": path.resolve(__dirname, "src/app-constants"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        // Разбиваем vendor библиотеки на отдельные чанки
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Mantine UI
          "vendor-mantine": [
            "@mantine/core",
            "@mantine/hooks",
            "@mantine/dates",
            "@mantine/modals",
          ],
          // MUI (большая библиотека)
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@mui/x-data-grid",
          ],
          // Tanstack / React Query
          "vendor-query": ["@tanstack/react-query"],
          // Charts
          "vendor-charts": ["chart.js", "react-chartjs-2"],
          // Иконки
          "vendor-icons": ["react-icons"],
          // Date utilities
          "vendor-date": ["dayjs", "date-fns"],
          // HTTP client
          "vendor-http": ["axios"],
          // Emotion убран из manualChunks — включается автоматически в нужные чанки
          // чтобы избежать проблем с порядком инициализации
        },
      },
    },
  },
});
