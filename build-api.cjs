// Bundles api/index.ts into api/index.js if the TS source exists; otherwise, no-ops.
const fs = require("fs");
const path = require("path");

async function main() {
  const tsEntry = path.resolve(process.cwd(), "api/index.ts");
  if (!fs.existsSync(tsEntry)) {
    console.log("[build:api] Skipping (api/index.ts not present)");
    return;
  }
  const esbuild = require("esbuild");
  console.log("[build:api] Bundling api/index.ts -> api/index.js");
  await esbuild.build({
    entryPoints: ["api/index.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: "api/index.js",
  });
  console.log("[build:api] Done");
}

main().catch((err) => {
  console.error("[build:api] Failed:", err && err.message ? err.message : err);
  process.exit(1);
});
