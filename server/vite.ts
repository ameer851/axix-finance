import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";

// Compute a base directory that works in both CJS and ESM bundles
let baseDir: string;
try {
  // @ts-ignore __dirname exists in CJS
  baseDir =
    typeof __dirname !== "undefined"
      ? __dirname
      : path.dirname(fileURLToPath(import.meta.url));
} catch {
  baseDir = process.cwd();
}

// Create a minimal shim logger; real Vite logger will be created dynamically in dev
const viteLogger = {
  error: (msg: any) => console.error(msg),
  warn: (msg: any) => console.warn(msg),
  info: (msg: any) => console.log(msg),
};

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Guard: ensure we pass a plain Node HTTP server that Vite can attach to.
  // Some environments may pass a wrapper lacking the needed event API.
  const hasOn = typeof (server as any)?.on === "function";
  const hmrServer = hasOn ? server : undefined;
  if (!hasOn) {
    console.warn(
      "⚠️ Provided server lacks 'on' method; HMR websocket disabled."
    );
  }
  const serverOptions = {
    middlewareMode: true as const,
    hmr: hmrServer ? { server: hmrServer } : false,
    allowedHosts: true as const,
  };

  // Dynamically import Vite and plugin-react only when needed (dev)
  if (process.env.NODE_ENV !== "development") {
    throw new Error("setupVite should only be called in development mode");
  }
  const viteMod = await import("vite");
  const { default: react } = await import("@vitejs/plugin-react");
  const createViteServer = viteMod.createServer;
  const realLogger = viteMod.createLogger();

  const vite = await createViteServer({
    configFile: false,
    root: path.resolve(baseDir, "..", "client"),
    resolve: {
      alias: {
        "@": path.resolve(baseDir, "..", "client", "src"),
        "@shared": path.resolve(baseDir, "..", "shared"),
        "@assets": path.resolve(baseDir, "..", "attached_assets"),
      },
    },
    plugins: [react()],
    customLogger: {
      ...realLogger,
      error: (msg, options) => {
        realLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        baseDir,
        "..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(baseDir, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
