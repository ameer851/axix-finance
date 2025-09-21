#!/usr/bin/env node
// Safe dist cleaner to avoid Windows EBUSY issues on locked media files (e.g. video playing in browser)
// It attempts to unlink files individually, skipping those that are busy, instead of rm -rf.
// Usage: node scripts/safe-clean-dist.cjs

const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "client", "dist");

function safeRemove(p) {
  try {
    const stat = fs.lstatSync(p);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(p)) {
        safeRemove(path.join(p, entry));
      }
      try {
        fs.rmdirSync(p);
      } catch (e) {
        if (
          e.code !== "ENOTEMPTY" &&
          e.code !== "EBUSY" &&
          e.code !== "EPERM"
        ) {
          console.warn("[safe-clean] dir remove warn", p, e.code);
        }
      }
    } else {
      try {
        fs.unlinkSync(p);
      } catch (e) {
        if (e.code === "EBUSY" || e.code === "EPERM") {
          console.warn("[safe-clean] skip locked file", path.basename(p));
        } else {
          console.warn("[safe-clean] file remove warn", p, e.code);
        }
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      console.warn("[safe-clean] lstat warn", p, e.code);
    }
  }
}

if (fs.existsSync(dist)) {
  console.log("[safe-clean] Cleaning dist directory...");
  for (const entry of fs.readdirSync(dist)) {
    safeRemove(path.join(dist, entry));
  }
  console.log("[safe-clean] Done (best-effort).");
} else {
  console.log("[safe-clean] dist does not exist, nothing to do.");
}
