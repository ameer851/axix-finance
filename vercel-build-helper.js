#!/usr/bin/env node

/**
 * Vercel Build Helper
 * This script helps with Vercel deployment by fixing common build issues
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔧 Preparing Axix Finance for Vercel build...");

// Check if package.json exists
if (!fs.existsSync("package.json")) {
  console.error("❌ package.json not found. Exiting.");
  process.exit(1);
}

// Read package.json
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
