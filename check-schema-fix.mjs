#!/usr/bin/env node

/**
 * Check the actual database schema for transactions table
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function checkDatabaseSchema() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔍 Checking database schema...\n");

    // Check users table structure
    console.log("1. Users table structure:");
    const { data: usersColumns, error: usersError } = await supabase.rpc(
      "get_table_columns",
      { table_name: "users" }
    );

    if (usersError) {
      console.log("❌ Error getting users columns:", usersError);
    } else {
      console.log("Users columns:", usersColumns);
    }

    // Check transactions table structure
    console.log("\n2. Transactions table structure:");
    const { data: txColumns, error: txError } = await supabase.rpc(
      "get_table_columns",
      { table_name: "transactions" }
    );

    if (txError) {
      console.log("❌ Error getting transactions columns:", txError);
    } else {
      console.log("Transactions columns:", txColumns);
    }

    // Try a simple query to see what happens
    console.log(
      "\n3. Testing transaction insertion with different user_id types..."
    );

    // Get user 24's uid
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, uid, email")
      .eq("id", 24)
      .single();

    if (userError) {
      console.log("❌ Error getting user:", userError);
      return;
    }

    console.log(
      `User 24 - ID: ${user.id}, UID: ${user.uid}, Email: ${user.email}`
    );

    // Try inserting with integer user_id
    console.log("\nTrying transaction with integer user_id...");
    const { data: tx1, error: tx1Error } = await supabase
      .from("transactions")
      .insert({
        user_id: 24, // integer
        type: "investment",
        amount: "100",
        status: "completed",
        description: "Test transaction",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tx1Error) {
      console.log("❌ Integer user_id failed:", tx1Error.message);
    } else {
      console.log("✅ Integer user_id worked:", tx1);
    }

    // Try inserting with UUID user_id
    console.log("\nTrying transaction with UUID user_id...");
    const { data: tx2, error: tx2Error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.uid, // UUID
        type: "investment",
        amount: "100",
        status: "completed",
        description: "Test transaction 2",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tx2Error) {
      console.log("❌ UUID user_id failed:", tx2Error.message);
    } else {
      console.log("✅ UUID user_id worked:", tx2);
    }
  } catch (error) {
    console.error("Schema check failed:", error);
  }
}

// Run the check
checkDatabaseSchema();
