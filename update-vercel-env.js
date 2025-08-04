#!/usr/bin/env node

/**
 * Update Vercel Environment Variables
 * Run this script before deploying to Vercel to update environment variables
 */

import { parse } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env file
const envPath = join(process.cwd(), ".env");
const env = parse(readFileSync(envPath));

console.log("🔍 Checking Supabase API keys and environment variables...");

// Create vercel.json file with updated settings
const vercelConfig = {
  version: 2,
  buildCommand: "npm run build",
  installCommand: "npm install --legacy-peer-deps",
  outputDirectory: "client/dist",
  framework: "vite",
  functions: {
    "api/*.ts": {
      runtime: "@vercel/node@2.15.10",
      memory: 1024,
    },
  },
  rewrites: [
    { source: "/api/(.*)", destination: "/api/$1" },
    { source: "/(.*)", destination: "/client/dist/$1" },
  ],
  env: {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
    DATABASE_URL: env.DATABASE_URL,
    SESSION_SECRET: env.SESSION_SECRET,
    JWT_SECRET: env.JWT_SECRET,
    RESEND_API_KEY: env.RESEND_API_KEY,
    EMAIL_FROM: env.EMAIL_FROM,
    EMAIL_FROM_NAME: env.EMAIL_FROM_NAME,
    SITE_URL: "https://www.axixfinance.com",
    FRONTEND_URL: "https://www.axixfinance.com",
    CLIENT_URL: "https://www.axixfinance.com",
    VITE_FRONTEND_URL: "https://www.axixfinance.com",
    VITE_API_URL: "https://www.axixfinance.com",
    CONTACT_EMAIL: env.CONTACT_EMAIL,
  },
};

// Write updated vercel.json file
writeFileSync(
  join(process.cwd(), "vercel.json"),
  JSON.stringify(vercelConfig, null, 2)
);

console.log("✅ Updated vercel.json with correct environment variables");
console.log("");
console.log("DEPLOYMENT INSTRUCTIONS:");
console.log("1. Commit these changes to your repository");
console.log("2. Push to GitHub");
console.log("3. Deploy to Vercel using the GitHub integration");
console.log(
  "4. Verify that all environment variables are correctly set in the Vercel dashboard"
);
console.log("");
console.log("If you're using the Vercel CLI, run:");
console.log("vercel --prod");
