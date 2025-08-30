import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: true,           // = 0.0.0.0 — слушаем все интерфейсы (видно с телефона)
    port: 3000,           // фиксированный порт
    strictPort: true,     // не прыгать на другой порт
    proxy: {
      // фронт (http://<твой-IP>:3000) → прокси на локальный Django (http://127.0.0.1:8000)
      "/api/v1": "http://127.0.0.1:8000",
    },
    // Если HMR не коннектится с телефона — раскомментируй и подставь свой IP:
    // hmr: { host: "192.168.0.103", port: 3000 },
  },
});
