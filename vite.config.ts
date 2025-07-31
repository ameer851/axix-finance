import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async () => {
  const plugins = [
    react(),
  ];

  // Conditionally add Replit-specific plugins only if they're available
  if (process.env.NODE_ENV !== "production") {
    try {
      // Only import Replit plugins if they exist
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
      plugins.push(runtimeErrorOverlay.default());
    } catch (error) {
      // Runtime error overlay not available - continue without it
      console.log("Replit runtime error overlay not available, continuing without it");
    }

    // Conditionally add cartographer plugin in development
    if (process.env.REPL_ID !== undefined) {
      try {
        const cartographerModule = await import("@replit/vite-plugin-cartographer");
        plugins.push(cartographerModule.cartographer());
      } catch (error) {
        // Cartographer plugin not available - continue without it
      }
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
