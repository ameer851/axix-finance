const { existsSync } = require("fs");
const { spawnSync } = require("child_process");

const pruneScript = "scripts/prune-api.cjs";
if (!existsSync(pruneScript)) {
  console.log("[prune-if-exists] No prune script found; skipping.");
  process.exit(0);
}

console.log("[prune-if-exists] Found prune script; executing.");
const res = spawnSync(process.execPath, [pruneScript], { stdio: "inherit" });
process.exit(res.status || 0);
