// vercel-build-helper.cjs
// Post-build helper for Vercel to ensure API functions run compiled JS instead of TS
// - Confirms api/index.js exists
// - Removes .ts files in api/ so the Vercel Node builder doesn't try to compile TS at runtime

const fs = require("fs");
const path = require("path");

// No-op: previously removed TS sources; we avoid that to not break Vercel's file scanning

function main() {
  const apiDir = path.resolve(__dirname, "api");
  const indexJs = path.join(apiDir, "index.js");
  const indexTs = path.join(apiDir, "index.ts");
  if (!fs.existsSync(indexJs)) {
    console.error(
      "[vercel-build-helper] ERROR: api/index.js not found. Ensure build:api ran before this step."
    );
    process.exitCode = 1;
    return;
  }
  console.log("[vercel-build-helper] api/index.js found (OK)");
  // Remove all TS sources under api/ to prevent Vercel attempting to typecheck them
  const entries = fs.readdirSync(apiDir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(apiDir, ent.name);
    if (ent.isFile()) {
      if (ent.name.endsWith(".ts") || ent.name.endsWith(".tsx")) {
        try {
          fs.unlinkSync(full);
        } catch {}
      }
      // keep index.js, remove other top-level compiled JS that might conflict
      if (ent.name.endsWith(".js") && ent.name !== "index.js") {
        try {
          fs.unlinkSync(full);
        } catch {}
      }
    } else if (ent.isDirectory()) {
      const subEntries = fs.readdirSync(full, { withFileTypes: true });
      for (const s of subEntries) {
        const subFull = path.join(full, s.name);
        if (s.isFile()) {
          if (s.name.endsWith(".ts") || s.name.endsWith(".tsx")) {
            try {
              fs.unlinkSync(subFull);
            } catch {}
          }
          // also remove compiled .js if there's a corresponding .ts in repo to avoid conflicts
          if (s.name.endsWith(".js")) {
            const tsName = s.name.replace(/\.js$/, ".ts");
            const tsPath = path.join(full, tsName);
            if (fs.existsSync(tsPath)) {
              try {
                fs.unlinkSync(subFull);
              } catch {}
            }
          }
        }
      }
    }
  }
}
main();
