import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async () => {
  const plugins = [react()];

  // Optionally add Replit-specific plugins if available (for Replit dev only)
  // These are not required for local or production builds and will be skipped if missing
  if (process.env.NODE_ENV !== "production") {
    try {
      // Only import Replit plugins if they exist
      // @ts-ignore
      const runtimeErrorOverlay = await import(
        "@replit/vite-plugin-runtime-error-modal"
      );
      if (runtimeErrorOverlay && runtimeErrorOverlay.default) {
        plugins.push(runtimeErrorOverlay.default());
      }
    } catch (error) {
      // Ignore missing module error
    }

    if (process.env.REPL_ID !== undefined) {
      try {
        // @ts-ignore
        const cartographerModule = await import(
          "@replit/vite-plugin-cartographer"
        );
        if (cartographerModule && cartographerModule.cartographer) {
          plugins.push(cartographerModule.cartographer());
        }
      } catch (error) {
        // Ignore missing module error
      }
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "client", "src", "assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    publicDir: path.resolve(__dirname, "client", "public"),
    build: {
      outDir: path.resolve(__dirname, "public"),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
      chunkSizeWarningLimit: 1500,
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
