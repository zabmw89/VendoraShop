import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "frontend")
      },
      dedupe: ['react', 'react-dom']
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true
    },
    // Static PWA assets live with the frontend rather than at the repository root.
    // Vite serves this directory in development and copies it into dist for production.
    publicDir: path.resolve(__dirname, 'frontend/public'),
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
      allowedHosts: true,
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true
        }
      }
    }
  };
});
