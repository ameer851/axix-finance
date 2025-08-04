#!/usr/bin/env node

/**
 * Pre-deployment Check Script
 * This script verifies that the project is ready for Vercel deployment
 *
 * Usage: node scripts/pre-deployment-check.cjs
 * Run this before deploying to Vercel to ensure all requirements are met
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Running pre-deployment checks for Axix Finance...");

// Check for required files
const requiredFiles = [
  "vercel.json",
  ".nvmrc",
  "api/server.ts",
  "api/fallback.ts",
  "vercel-build-helper.cjs",
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error(`❌ Missing required file: ${file}`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error(
    "❌ Some required files are missing. Please create them before deployment."
  );
  process.exit(1);
}

// Check Node.js version
let nodeVersionOk = true;
try {
  const nvmrcContent = fs
    .readFileSync(path.join(process.cwd(), ".nvmrc"), "utf8")
    .trim();
  console.log(`ℹ️ .nvmrc requires Node.js version: ${nvmrcContent}`);

  const currentNodeVersion = process.version;
  console.log(`ℹ️ Current Node.js version: ${currentNodeVersion}`);

  // Check if package.json has correct engine specification
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
  );
  if (!packageJson.engines || !packageJson.engines.node) {
    console.warn("⚠️ package.json is missing Node.js engine specification");
    nodeVersionOk = false;
  } else {
    console.log(
      `ℹ️ package.json requires Node.js version: ${packageJson.engines.node}`
    );

    // Check that .nvmrc and package.json have matching Node versions
    if (
      packageJson.engines.node !== nvmrcContent &&
      packageJson.engines.node !== nvmrcContent.replace("x", "0")
    ) {
      console.error(
        "❌ Mismatch between .nvmrc and package.json Node.js versions"
      );
      nodeVersionOk = false;
    }
  }
} catch (err) {
  console.error("❌ Error checking Node.js version:", err.message);
  nodeVersionOk = false;
}

// Check vercel.json configuration
let vercelConfigOk = true;
try {
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8")
  );

  // Check for required properties
  const requiredProps = [
    "version",
    "buildCommand",
    "outputDirectory",
    "functions",
  ];
  for (const prop of requiredProps) {
    if (!vercelConfig[prop]) {
      console.error(`❌ vercel.json is missing required property: ${prop}`);
      vercelConfigOk = false;
    }
  }

  // Check that functions have correct runtime
  if (vercelConfig.functions && vercelConfig.functions["api/**/*"]) {
    const runtime = vercelConfig.functions["api/**/*"].runtime;
    if (!runtime || !runtime.includes("@vercel/node")) {
      console.error("❌ Invalid runtime for API functions in vercel.json");
      vercelConfigOk = false;
    } else {
      console.log(`ℹ️ API functions using runtime: ${runtime}`);
    }
  }

  // Check routes and rewrites
  if (!vercelConfig.routes && !vercelConfig.rewrites) {
    console.warn("⚠️ vercel.json is missing both routes and rewrites");
  }
} catch (err) {
  console.error("❌ Error checking vercel.json:", err.message);
  vercelConfigOk = false;
}

// Check build helper script
let buildHelperOk = true;
try {
  const helperContent = fs.readFileSync(
    path.join(process.cwd(), "vercel-build-helper.cjs"),
    "utf8"
  );
  if (!helperContent.includes("Creating Vercel adapter")) {
    console.warn(
      "⚠️ vercel-build-helper.cjs may not create the Vercel adapter"
    );
    buildHelperOk = false;
  }
} catch (err) {
  console.error("❌ Error checking build helper:", err.message);
  buildHelperOk = false;
}

// Final report
console.log("\n📋 Deployment Readiness Report:");
console.log(`Required Files: ${allFilesExist ? "✅ OK" : "❌ ISSUES FOUND"}`);
console.log(`Node.js Version: ${nodeVersionOk ? "✅ OK" : "❌ ISSUES FOUND"}`);
console.log(`Vercel Config: ${vercelConfigOk ? "✅ OK" : "❌ ISSUES FOUND"}`);
console.log(`Build Helper: ${buildHelperOk ? "✅ OK" : "❌ ISSUES FOUND"}`);

if (allFilesExist && nodeVersionOk && vercelConfigOk && buildHelperOk) {
  console.log(
    "\n✅ All checks passed! Your project is ready for Vercel deployment."
  );
  process.exit(0);
} else {
  console.log(
    "\n⚠️ Some checks failed. Please address the issues before deployment."
  );
  process.exit(1);
}
