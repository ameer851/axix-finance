#!/usr/bin/env node

/**
 * Script to test deposit confirmation with proper authentication
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDepositWithAuth() {
  try {
    console.log("🔍 Testing deposit confirmation with authentication...");

    // First, test with a simple unauthenticated request to see the error
    console.log("\n1️⃣ Testing unauthenticated request:");
    try {
      const response = await fetch(
        "https://www.axixfinance.com/api/transactions/deposit-confirmation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: 100,
            transactionHash: "test-hash-123",
            method: "bitcoin",
            planName: "Basic Plan",
          }),
        }
      );

      const result = await response.text();
      console.log("Status:", response.status);
      console.log("Response:", result);
    } catch (error) {
      console.error("Request failed:", error.message);
    }

    // Test if we can get a session from Supabase
    console.log("\n2️⃣ Testing Supabase session:");
    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    console.log("Session error:", sessionError);
    console.log("Session exists:", !!session.session);

    console.log("\n3️⃣ Testing API environment:");
    const envResponse = await fetch(
      "https://www.axixfinance.com/api/env-check"
    );
    const envData = await envResponse.json();
    console.log("Environment:", envData);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testDepositWithAuth();
