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
  build: {
    rollupOptions: {
      output: {
        // Vendor only — assigning src/ modules here produced circular chunks
        // between the realtime barrel and its manager.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (/[\/]node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/.test(id)) {
            return 'react';
          }
          if (id.includes('@tanstack')) return 'query';
          if (id.includes('@dnd-kit')) return 'dnd';
          if (id.includes('laravel-echo') || id.includes('pusher-js')) return 'realtime';
          if (id.includes('@tsparticles')) return 'particles';
          if (id.includes('lucide-react')) return 'icons';

          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 900,
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
