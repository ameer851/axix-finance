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
  // Remove TS entry after build to avoid Vercel function path conflicts
  if (fs.existsSync(indexTs)) {
    try {
      fs.unlinkSync(indexTs);
      console.log(
        "[vercel-build-helper] Removed api/index.ts to prevent deployment conflict"
      );
    } catch (e) {
      console.warn(
        "[vercel-build-helper] Could not remove api/index.ts:",
        e?.message || e
      );
    }
  }
  // Clean up previously generated JS files that conflict with TS sources to avoid Vercel filename conflicts
  const entries = fs.readdirSync(apiDir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(apiDir, ent.name);
    if (ent.isFile()) {
      // remove top-level compiled JS except index.js
      if (ent.name.endsWith(".js") && ent.name !== "index.js") {
        try {
          fs.unlinkSync(full);
        } catch {}
      }
    } else if (ent.isDirectory()) {
      // in subfolders, remove compiled .js that have a sibling .ts
      const subEntries = fs.readdirSync(full, { withFileTypes: true });
      for (const s of subEntries) {
        if (s.isFile() && s.name.endsWith(".js")) {
          const tsName = s.name.replace(/\.js$/, ".ts");
          const tsPath = path.join(full, tsName);
          if (fs.existsSync(tsPath)) {
            try {
              fs.unlinkSync(path.join(full, s.name));
            } catch {}
          }
        }
      }
    }
  }
}
main();
