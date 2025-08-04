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
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyApiKeys() {
  console.log("🔍 Verifying Supabase API Keys...");
  console.log(`Supabase URL: ${supabaseUrl}`);

  // Test anon key
  try {
    console.log("Testing anon key...");
    const anonResponse = await fetch(`${supabaseUrl}/rest/v1/users?limit=1`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (anonResponse.ok) {
      console.log("✅ Anon key is working correctly");
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
        },
      }
    );

    if (serviceResponse.ok) {
      console.log("✅ Service role key is working correctly");
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
