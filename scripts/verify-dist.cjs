#!/usr/bin/env node
// Simple post-build verification: ensure the expected output directory exists and has index.html
const fs = require("fs");
const path = require("path");

const distDir = path.join(process.cwd(), "dist");
const indexFile = path.join(distDir, "index.html");

function fail(msg) {
  console.error(`❌ Build verification failed: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(distDir))
  fail("dist directory not found at project root (expected ./dist).");
if (!fs.existsSync(indexFile))
  fail("dist/index.html not found. Ensure Vite built the client.");

// Basic size sanity check
const stats = fs.statSync(indexFile);
if (stats.size < 500) {
  console.warn(
    "⚠️ dist/index.html is unusually small (<500 bytes). It might be a fallback placeholder."
  );
}

console.log("✅ dist verification passed.");
