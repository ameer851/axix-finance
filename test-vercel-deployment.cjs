#!/usr/bin/env node

/**
 * Vercel Deployment Test Script
 * Tests the build output to ensure compatibility with Vercel
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Testing Vercel deployment configuration...");

// Check if package.json has the correct Node.js version
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (packageJson.engines && packageJson.engines.node === "18.x") {
  console.log("✅ Node.js version is correctly set to 18.x");
} else {
  console.error("❌ Node.js version should be set to 18.x in package.json");
}

// Check if vercel.json has the correct output directory
if (fs.existsSync("vercel.json")) {
  const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  if (vercelConfig.outputDirectory === "dist") {
    console.log(
      '✅ Output directory in vercel.json is correctly set to "dist"'
    );
  } else {
    console.error(
      `❌ Output directory in vercel.json is set to "${vercelConfig.outputDirectory}" but should be "dist"`
    );
  }
} else {
  console.warn(
    "⚠️ vercel.json not found. This file is recommended for Vercel deployments."
  );
}

// Check vite.config.ts build output directory
try {
  const viteConfig = fs.readFileSync("vite.config.ts", "utf8");
  if (viteConfig.includes('outDir: path.resolve(__dirname, "dist")')) {
    console.log('✅ Vite build output directory is correctly set to "dist"');
  } else if (
    viteConfig.includes('outDir: path.resolve(__dirname, "dist/public")')
  ) {
    console.error(
      '❌ Vite build output directory is set to "dist/public" but should be "dist"'
    );
  } else {
    console.warn(
      "⚠️ Could not verify Vite build output directory in vite.config.ts"
    );
  }
} catch (error) {
  console.error("❌ Could not read vite.config.ts:", error.message);
}

// Test build if requested
if (process.argv.includes("--build")) {
  console.log("\n🏗️ Running test build...");
  try {
    execSync("npm run build", { stdio: "inherit" });
    console.log("✅ Build completed successfully");

    // Check if dist directory exists
    if (fs.existsSync("dist") && fs.statSync("dist").isDirectory()) {
      console.log("✅ dist directory was created");

      // Check if index.html exists in dist
      if (fs.existsSync(path.join("dist", "index.html"))) {
        console.log("✅ index.html found in dist directory");
      } else {
        console.error("❌ index.html not found in dist directory");
      }

      // Count files in dist directory
      const files = fs.readdirSync("dist");
      console.log(`ℹ️ Found ${files.length} files/directories in dist`);
    } else {
      console.error("❌ dist directory was not created");
    }
  } catch (error) {
    console.error("❌ Build failed:", error.message);
  }
}

console.log("\n✨ Deployment test complete");
