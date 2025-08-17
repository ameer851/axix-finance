const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const API_ENTRIES = ["api/server.ts"];

async function main() {
  const entries = API_ENTRIES.filter((entry) => fs.existsSync(entry));

  if (entries.length === 0) {
    console.log("[build:api] No API source files found to build");
    return;
  }

  console.log("[build:api] Building API files:", entries.join(", "));

  try {
    await esbuild.build({
      entryPoints: entries,
      bundle: true,
      platform: "node",
      format: "cjs",
      outdir: "api",
      external: ["@vercel/node", "express", "@supabase/supabase-js"],
      target: "node18",
    });
    console.log("[build:api] Successfully built API files");
  } catch (error) {
    console.error("[build:api] Build failed:", error);
    process.exit(1);
  }
}

// Inline prune step: move extra api files to api_disabled/pruned when asked
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function moveFile(src, dest) {
  ensureDir(path.dirname(dest));
  try {
    fs.renameSync(src, dest);
    console.log(`[prune-api] Moved ${src} -> ${dest}`);
  } catch (e) {
    try {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
      console.log(`[prune-api] Copied+Removed ${src} -> ${dest}`);
    } catch (err) {
      console.warn(`[prune-api] Failed to move ${src}:`, err?.message || err);
    }
  }
}

function runPrune() {
  const shouldPrune = process.env.VERCEL === "1" || process.env.PRUNE_API === "1";
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

main().catch((err) => {
  console.error("[build:api] Failed:", err && err.message ? err.message : err);
  process.exit(1);
});

// run prune after build
runPrune();
