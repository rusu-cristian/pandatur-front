import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import purgecss from "vite-plugin-purgecss";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // PurgeCSS удаляет неиспользуемый CSS в production build
    purgecss({
      content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
      // Сохраняем классы Mantine и динамические классы
      safelist: {
        standard: [
          /^mantine-/,
          /^rc-/,
          /^ps-/,
          /^pro-sidebar/,
          /^react-/,
          /^ant-/,
          /^Mui/,
          /^css-/,
        ],
        deep: [/mantine/, /rc-table/, /sidebar/, /MuiDataGrid/],
      },
    }),
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
          // Emotion (стили)
          "vendor-emotion": ["@emotion/react", "@emotion/styled"],
        },
      },
    },
  },
});
