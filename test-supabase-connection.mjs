#!/usr/bin/env node

/**
 * Troubleshoot Supabase Connection
 * This script tests basic connectivity to Supabase
 */

import fetch from "node-fetch";

const supabaseUrl = "https://wvnyiinrmfysabsfztii.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k";

async function testSupabaseConnection() {
  console.log("🔍 Testing basic Supabase connectivity...");
  console.log(`Supabase URL: ${supabaseUrl}`);

  try {
    // Test a simple endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (response.ok) {
      console.log("✅ Connection successful!");
      const data = await response.text();
      console.log("Response:", data);
    } else {
      console.error(`❌ Connection failed with status: ${response.status}`);
      console.error("Response:", await response.text());
    }
  } catch (error) {
    console.error("❌ Connection error:", error.message);
  }
}

// Test version endpoint
async function testVersionEndpoint() {
  console.log("\n🔍 Testing version endpoint...");

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
      },
    });

    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log(`Body: ${text}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run tests
await testSupabaseConnection();
await testVersionEndpoint();
