#!/usr/bin/env node

/**
 * Vercel Build Helper
 * This script helps with Vercel deployment by fixing common build issues
 * Last updated: August 4, 2025
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔧 Preparing Axix Finance for Vercel build...");

// Check if package.json exists
if (!fs.existsSync("package.json")) {
  console.error("❌ package.json not found. Exiting.");
  process.exit(1);
}

// Install Rollup dependencies to fix build issues
try {
  console.log("📦 Installing Rollup dependencies for the current platform...");
  execSync("npm install --no-save @rollup/rollup-linux-x64-gnu", {
    stdio: "inherit",
  });
  console.log("✅ Rollup dependencies installed");
} catch (error) {
  console.warn("⚠️ Failed to install Rollup dependencies:", error.message);
  console.log("Continuing with build anyway...");
}
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Fix build script if needed
if (packageJson.scripts.build.includes("esbuild server/index.ts")) {
  console.log("⚠️ Fixing build script...");
  packageJson.scripts.build = "vite build";
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
  console.log("✅ Build script fixed");
}

// Create an adapter file for the server if needed
const vercelAdapter = path.join("server", "vercel-adapter.ts");
if (!fs.existsSync(vercelAdapter)) {
  console.log("⚠️ Creating Vercel adapter file...");
  const adapterContent = `/**
 * Vercel Adapter
 * This file helps run the API in Vercel's serverless environment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { apiHandler } from '../api/server';

// Export the handler for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  return apiHandler(req, res);
}
`;
  fs.writeFileSync(vercelAdapter, adapterContent);
  console.log("✅ Vercel adapter created");
}

console.log("✅ Build preparation complete!");
console.log(
  "📝 Note: API functionality is handled by serverless functions in the /api directory"
);
