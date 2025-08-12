// vercel-build-helper.cjs
// Post-build helper for Vercel to ensure API functions run compiled JS instead of TS
// - Confirms api/index.js exists
// - Removes .ts files in api/ so the Vercel Node builder doesn't try to compile TS at runtime

const fs = require("fs");
const path = require("path");

function rmTsFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.lstatSync(full);
    if (stat.isDirectory()) {
      rmTsFilesRecursively(full);
    } else if (stat.isFile()) {
      if (full.endsWith(".ts") && !full.endsWith(".d.ts")) {
        // Do not delete source maps or JS
        try {
          fs.unlinkSync(full);
          console.log("[vercel-build-helper] removed TS source", full);
        } catch (e) {
          console.warn(
            "[vercel-build-helper] failed to remove",
            full,
            e.message
          );
        }
      }
    }
  }
}

function main() {
  const apiDir = path.resolve(__dirname, "api");
  const indexJs = path.join(apiDir, "index.js");
  if (!fs.existsSync(indexJs)) {
    console.error(
      "[vercel-build-helper] ERROR: api/index.js not found. Ensure build:api ran before this step."
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    "[vercel-build-helper] Ensuring Vercel uses JS for API functions"
  );
  rmTsFilesRecursively(apiDir);
}

main();
