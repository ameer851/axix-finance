#!/usr/bin/env node
// Apply the unique constraint migration to Supabase
// This script demonstrates how to apply the migration via Supabase client

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

console.log("\n=== APPLYING DATABASE MIGRATION ===\n");
console.log("⚠️  NOTE: This script demonstrates the SQL to run.");
console.log("⚠️  You must apply this SQL manually in Supabase SQL Editor.\n");

const SQL_TO_RUN = `
-- Migration: Add unique constraint to prevent duplicate investment returns per day
-- Date: October 1, 2025
-- Purpose: Prevent the same investment from having multiple returns on the same date

CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_returns_unique_per_day 
ON investment_returns (investment_id, return_date);
`;

console.log("=" . repeat(70));
console.log("SQL TO RUN IN SUPABASE SQL EDITOR:");
console.log("=".repeat(70));
console.log(SQL_TO_RUN);
console.log("=".repeat(70));

console.log("\n📝 INSTRUCTIONS:\n");
console.log("1. Go to your Supabase project dashboard");
console.log("2. Navigate to 'SQL Editor' in the left sidebar");
console.log("3. Click 'New Query'");
console.log("4. Copy and paste the SQL above");
console.log("5. Click 'Run' to execute");
console.log("6. Verify the index was created successfully\n");

console.log("✅ After applying, you can verify with:");
console.log("   SELECT * FROM pg_indexes WHERE tablename = 'investment_returns';");
console.log("\n");

// Optionally try to check if index already exists
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function checkIndexExists() {
  try {
    // Try to query pg_indexes (may not have permission)
    const { data, error } = await supabase
      .from("pg_indexes")
      .select("indexname")
      .eq("tablename", "investment_returns")
      .eq("indexname", "idx_investment_returns_unique_per_day");
    
    if (error) {
      console.log("ℹ️  Cannot check index status automatically (permission required)");
      console.log("   Please verify manually after running the SQL.\n");
    } else if (data && data.length > 0) {
      console.log("✅ Index 'idx_investment_returns_unique_per_day' already exists!\n");
    } else {
      console.log("❌ Index not found. Please apply the migration SQL above.\n");
    }
  } catch (e) {
    console.log("ℹ️  Cannot check index status automatically");
  }
}

checkIndexExists();