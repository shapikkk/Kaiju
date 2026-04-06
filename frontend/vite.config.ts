import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import electron from 'vite-plugin-electron'
import { defineConfig } from "vite"

// When running inside Docker (VITE_WEB_ONLY=true) we skip the Electron plugin
// because there is no display available in the container and the Electron binary
// is not downloaded (ELECTRON_SKIP_BINARY_DOWNLOAD=1).
const isWebOnly = process.env.VITE_WEB_ONLY === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(isWebOnly ? [] : [
      electron([
        { entry: 'electron/main.ts' },
        { entry: 'electron/preload.ts' },
      ])
    ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@processes": path.resolve(__dirname, "./src/processes"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@widgets": path.resolve(__dirname, "./src/widgets"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@entities": path.resolve(__dirname, "./src/entities"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
    },
    watch: {
      usePolling: true,
    },
  },
})
