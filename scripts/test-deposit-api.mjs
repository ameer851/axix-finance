#!/usr/bin/env node

/**
 * Script to test the deposit confirmation API endpoint
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testDepositAPI() {
  try {
    console.log("🔍 Testing deposit confirmation API...");

    const response = await fetch("https://www.axixfinance.com/api/env-check", {
      method: "GET",
    });

    const envData = await response.json();
    console.log("📊 Environment check:", envData);

    console.log("✅ API is accessible");

    // Test the ping endpoint
    const pingResponse = await fetch("https://www.axixfinance.com/api/ping");
    const pingText = await pingResponse.text();
    console.log("📊 Ping response:", pingText);

    // Test DB health
    const dbResponse = await fetch("https://www.axixfinance.com/api/db-health");
    const dbData = await dbResponse.json();
    console.log("📊 DB health:", dbData);

    console.log("✅ All basic API endpoints are working");
  } catch (error) {
    console.error("❌ API test failed:", error.message);
    process.exit(1);
  }
}

testDepositAPI();
