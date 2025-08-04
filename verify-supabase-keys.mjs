#!/usr/bin/env node

/**
 * Supabase API Key Verification Script
 * This script verifies that the Supabase API keys are working correctly
 */

import { config } from "dotenv";
import fetch from "node-fetch";

// Load environment variables
config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://wvnyiinrmfysabsfztii.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDM2NywiZXhwIjoyMDY4NjcwMzY3fQ.zLhFm0aPCDfbUQHWWdPJeRfXaI06JP1sHzfGdHM0n9g";

async function verifyApiKeys() {
  console.log("🔍 Verifying Supabase API Keys...");
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Using anon key: ${supabaseAnonKey.substring(0, 10)}...`);
  console.log(`Using service key: ${supabaseServiceKey.substring(0, 10)}...`);

  // Test anon key
  try {
    console.log("Testing anon key...");
    const anonResponse = await fetch(`${supabaseUrl}/rest/v1/users?limit=1`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
    });

    if (anonResponse.ok) {
      console.log("✅ Anon key is working correctly");
      const data = await anonResponse.json();
      console.log(`  Retrieved ${data.length} users`);
    } else {
      console.error("❌ Anon key failed:", await anonResponse.text());
    }
  } catch (error) {
    console.error("❌ Error testing anon key:", error.message);
  }

  // Test service role key
  try {
    console.log("Testing service role key...");
    const serviceResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?limit=1`,
      {
        method: "GET",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (serviceResponse.ok) {
      console.log("✅ Service role key is working correctly");
      const data = await serviceResponse.json();
      console.log(`  Retrieved ${data.length} users`);
    } else {
      console.error(
        "❌ Service role key failed:",
        await serviceResponse.text()
      );
    }
  } catch (error) {
    console.error("❌ Error testing service role key:", error.message);
  }

  console.log("\nIf any keys failed, please:");
  console.log("1. Check your Supabase project settings");
  console.log("2. Generate new API keys if needed");
  console.log("3. Update your .env file");
  console.log("4. Update your Vercel environment variables");
}

verifyApiKeys();
