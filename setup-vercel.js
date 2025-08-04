#!/usr/bin/env node

/**
 * Vercel Setup Script
 * This script helps prepare the project for Vercel deployment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Preparing Axix Finance for Vercel deployment...");

// Check if package.json exists
if (!fs.existsSync("package.json")) {
  console.error(
    "❌ package.json not found. Make sure you are in the project root."
  );
  process.exit(1);
}

// Make sure @vercel/node is installed
try {
  console.log("📦 Installing required dependencies...");
  execSync("npm install --save-dev @vercel/node@2.15.3", { stdio: "inherit" });
  console.log("✅ Dependencies installed successfully");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

// Check vercel.json
if (!fs.existsSync("vercel.json")) {
  console.log("⚠️ vercel.json not found, creating it...");

  const vercelConfig = {
    version: 2,
    buildCommand: "npm run build",
    outputDirectory: "dist/public",
    installCommand: "npm install --legacy-peer-deps",
    functions: {
      "api/**/*": {
        runtime: "@vercel/node@2.15.3",
      },
    },
    rewrites: [
      {
        source: "/api/(.*)",
        destination: "/api/server",
      },
      {
        source: "/(.*)",
        destination: "/index.html",
      },
    ],
  };

  fs.writeFileSync("vercel.json", JSON.stringify(vercelConfig, null, 2));
  console.log("✅ Created vercel.json");
} else {
  console.log("✅ vercel.json already exists");
}

// Check for API directory
if (!fs.existsSync("api")) {
  console.log("⚠️ api directory not found, creating it...");
  fs.mkdirSync("api", { recursive: true });

  // Create basic health endpoint
  const healthEndpoint = `import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Axix Finance API is operational"
  });
}`;

  fs.writeFileSync("api/health.ts", healthEndpoint);
  console.log("✅ Created api/health.ts endpoint");
} else {
  console.log("✅ api directory already exists");
}

console.log(
  "\n🎉 Setup complete! Your project is ready for Vercel deployment."
);
console.log("\n📋 Next steps:");
console.log("1. Commit and push your changes to GitHub");
console.log("2. Import your project in the Vercel dashboard");
console.log("3. Set up required environment variables");
console.log("4. Deploy your application");
