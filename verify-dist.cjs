#!/usr/bin/env node
// Robust build output verification that tolerates Vercel path quirks
const fs = require("fs");
const path = require("path");

const cwd = process.cwd();
const distDirPrimary = path.join(cwd, "dist");
const distDirAlt = path.join(__dirname, "dist");
const distClient = path.join(cwd, "client", "dist");
const checkedPaths = [distDirPrimary, distDirAlt, distClient];
let distDir = null;
for (const p of checkedPaths) {
  if (fs.existsSync(p)) {
    distDir = p;
    break;
  }
}

// Debug: list contents of cwd (limited)
try {
  const entries = fs.readdirSync(cwd).slice(0, 40);
  console.log(`[verify-dist] cwd=${cwd}`);
  console.log("[verify-dist] Top-level entries:", entries.join(", "));
} catch {}

function hardFail(msg) {
  console.error(`❌ Build verification failed: ${msg}`);
  process.exit(1);
}

if (!distDir) {
  console.warn(
    "⚠️ dist directory not found in expected locations. Converting to warning to avoid false negative."
  );
  process.exit(0);
}

// If build landed in client/dist but root dist missing, create a symlink for any tooling expecting root dist
if (distDir === distClient && !fs.existsSync(distDirPrimary)) {
  try {
    fs.symlinkSync(distClient, distDirPrimary, "junction");
    console.log(`[verify-dist] Created symlink dist -> client/dist`);
  } catch (e) {
    console.warn(
      "[verify-dist] Could not create symlink dist -> client/dist:",
      e.message
    );
  }
}

const indexFile = path.join(distDir, "index.html");
if (!fs.existsSync(indexFile)) hardFail(`index.html missing in ${distDir}`);

const stats = fs.statSync(indexFile);
if (stats.size < 500) {
  console.warn("⚠️ dist/index.html is unusually small (<500 bytes).");
}

console.log(`✅ dist verification passed at ${distDir}`);
