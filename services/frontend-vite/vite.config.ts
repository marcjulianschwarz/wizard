import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pin the dev port so the origin matches the backend's allowed CORS origin
  // (services/backend/.env FRONTEND_URL=http://localhost:3001). strictPort
  // fails loudly instead of silently falling back to another port.
  server: {
    port: 3001,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
