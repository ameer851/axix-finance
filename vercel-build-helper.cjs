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
  if (!fs.existsSync(indexJs)) {
    console.error(
      "[vercel-build-helper] ERROR: api/index.js not found. Ensure build:api ran before this step."
    );
    process.exitCode = 1;
    return;
  }
  console.log("[vercel-build-helper] api/index.js found (OK)");
  // Remove TypeScript entry so Vercel picks the bundled JS for the index function
  const indexTs = path.join(apiDir, "index.ts");
  if (fs.existsSync(indexTs)) {
    try {
      fs.unlinkSync(indexTs);
      console.log("[vercel-build-helper] removed", indexTs);
    } catch (e) {
      console.warn(
        "[vercel-build-helper] could not remove",
        indexTs,
        e.message
      );
    }
  }
}
main();
