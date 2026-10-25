import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import { analyzer } from "vite-bundle-analyzer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), analyzer()],
  server: {
    host: "0.0.0.0",
    port: 4000, // Replace with your desired port number
    strictPort: true, // Optional: exits if the port is already in use instead of auto-incrementing
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
