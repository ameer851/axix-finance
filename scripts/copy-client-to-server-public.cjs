#!/usr/bin/env node
// Copy built client assets into dist/server/public (mirrors Dockerfile logic)
const fs = require("fs");
const path = require("path");

// Vite is configured with root=client, and build:frontend uses `--outDir dist`,
// which resolves to client/dist. Copy from there into dist/server/public.
const clientDist = path.join(process.cwd(), "client", "dist");
const serverDir = path.join(process.cwd(), "dist", "server");
const serverPublic = path.join(serverDir, "public");

if (!fs.existsSync(clientDist)) {
  console.error(
    "[copy-client] client/dist (frontend build) not found, run build:frontend first"
  );
  process.exit(1);
}
if (!fs.existsSync(serverDir)) {
  console.error("[copy-client] dist/server not found, run build:server first");
  process.exit(1);
}
// Clean the target to avoid stale assets lingering between builds
fs.rmSync(serverPublic, { recursive: true, force: true });
fs.mkdirSync(serverPublic, { recursive: true });

// Copy everything in client/dist into server/public
for (const entry of fs.readdirSync(clientDist)) {
  const srcPath = path.join(clientDist, entry);
  const destPath = path.join(serverPublic, entry);
  fs.cpSync(srcPath, destPath, { recursive: true });
}
console.log("[copy-client] Copied client/dist/* -> dist/server/public");
