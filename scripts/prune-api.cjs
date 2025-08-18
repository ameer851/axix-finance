const fs = require("fs");
const path = require("path");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function moveFile(src, dest) {
  ensureDir(path.dirname(dest));
  try {
    fs.renameSync(src, dest);
    console.log(`[prune-api] Moved ${src} -> ${dest}`);
  } catch (e) {
    // Fallback to copy+unlink for cross-device
    try {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
      console.log(`[prune-api] Copied+Removed ${src} -> ${dest}`);
    } catch (err) {
      console.warn(`[prune-api] Failed to move ${src}:`, err?.message || err);
    }
  }
}

function main() {
  const shouldPrune =
    process.env.VERCEL === "1" || process.env.PRUNE_API === "1";
  if (!shouldPrune) {
    console.log("[prune-api] Skipping (set PRUNE_API=1 or VERCEL=1 to enable)");
    return;
  }

  const apiDir = path.join(process.cwd(), "api");
  const destDir = path.join(process.cwd(), "api_disabled", "pruned");
  ensureDir(destDir);

  const keep = new Set([
    "server.ts",
    "server.js",
    "package.json",
    "routes.ts.new",
    "utils",
    "middleware",
    "lib",
  ]);

  if (!fs.existsSync(apiDir)) {
    console.log("[prune-api] No api directory found");
    return;
  }

  const entries = fs.readdirSync(apiDir);
  for (const name of entries) {
    if (keep.has(name)) continue;
    const src = path.join(apiDir, name);
    const dest = path.join(destDir, name);
    moveFile(src, dest);
  }
}

main();
