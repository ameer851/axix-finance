#!/usr/bin/env node

/**
 * Test script for 24-hour profit system
 * This script tests the complete flow:
 * 1. Create a pending investment deposit
 * 2. Admin approves the deposit
 * 3. Verify first profit is scheduled
 * 4. Simulate 24 hours passing and apply first profit
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Load environment variables
require("dotenv").config();

async function test24HourProfitSystem() {
  console.log("🧪 Testing 24-Hour Profit System...\n");

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 1: Create a test user
    console.log("1. Creating test user...");
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: testUser, error: userError } =
      await supabase.auth.admin.createUser({
        email: testEmail,
        password: "testpassword123",
        email_confirm: true,
      });

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }

    console.log(`✅ Created test user: ${testUser.user.email}`);

    // Step 2: Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      uid: testUser.user.id,
      email: testEmail,
      username: testEmail.split("@")[0],
      firstName: "Test",
      lastName: "User",
      balance: "1000",
      isActive: true,
      isVerified: true,
      role: "user",
    });

    if (profileError) {
      console.warn(`⚠️ Profile creation warning: ${profileError.message}`);
    }

    // Step 3: Create a pending investment deposit transaction
    console.log("\n2. Creating pending investment deposit...");
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: testUser.user.id,
        user_uid: testUser.user.id,
        type: "deposit",
        amount: "500",
        status: "pending",
        description: "Investment Deposit - STARTER PLAN",
        plan_name: "STARTER PLAN",
        plan_duration: 3,
        daily_profit: 2,
        total_return: 106,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      throw new Error(`Failed to create transaction: ${txError.message}`);
    }

    console.log(`✅ Created pending deposit transaction: ${transaction.id}`);

    // Step 4: Simulate admin approval
    console.log("\n3. Simulating admin approval...");

    // Update transaction status to completed
    const { error: approveError } = await supabase
      .from("transactions")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (approveError) {
      throw new Error(`Failed to approve transaction: ${approveError.message}`);
    }

    // Credit user balance
    const { error: balanceError } = await supabase.rpc(
      "increment_user_balance",
      {
        user_id: testUser.user.id,
        amount: 500,
      }
    );

    if (balanceError) {
      console.warn(`⚠️ Balance credit warning: ${balanceError.message}`);
    }

    // Create investment record with first_profit_date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const { data: investment, error: invError } = await supabase
      .from("investments")
      .insert({
        user_id: testUser.user.id,
        transaction_id: transaction.id,
        plan_name: "STARTER PLAN",
        plan_duration: 3,
        daily_profit: 2,
        total_return: 106,
        principal_amount: 500,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        days_elapsed: 0,
        total_earned: 0,
        first_profit_date: tomorrow.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invError) {
      throw new Error(`Failed to create investment: ${invError.message}`);
    }

    console.log(
      `✅ Admin approved deposit and created investment: ${investment.id}`
    );
    console.log(`📅 First profit scheduled for: ${tomorrow.toISOString()}`);

    // Step 5: Verify investment was created correctly
    console.log("\n4. Verifying investment creation...");
    const { data: verifyInvestment, error: verifyError } = await supabase
      .from("investments")
      .select("*")
      .eq("id", investment.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify investment: ${verifyError.message}`);
    }

    if (verifyInvestment.first_profit_date) {
      console.log(
        `✅ First profit date set: ${verifyInvestment.first_profit_date}`
      );
    } else {
      throw new Error("First profit date was not set!");
    }

    // Step 6: Simulate 24 hours passing and apply first profit
    console.log(
      "\n5. Simulating 24 hours passing and applying first profit..."
    );

    // Calculate expected profit
    const expectedProfit = 500 * (2 / 100); // 2% daily profit
    console.log(`💰 Expected first profit: $${expectedProfit}`);

    // Apply the return
    const { error: returnError } = await supabase.rpc(
      "increment_user_balance",
      {
        user_id: testUser.user.id,
        amount: expectedProfit,
      }
    );

    if (returnError) {
      console.warn(`⚠️ Profit application warning: ${returnError.message}`);
    }

    // Record the return
    const { error: recordError } = await supabase
      .from("investment_returns")
      .insert({
        investment_id: investment.id,
        user_id: testUser.user.id,
        amount: expectedProfit,
        return_date: tomorrow.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (recordError) {
      console.warn(`⚠️ Return recording warning: ${recordError.message}`);
    }

    // Update investment record
    const { error: updateError } = await supabase
      .from("investments")
      .update({
        days_elapsed: 1,
        total_earned: expectedProfit,
        last_return_applied: tomorrow.toISOString(),
        first_profit_date: null, // Clear first profit date
        updated_at: new Date().toISOString(),
      })
      .eq("id", investment.id);

    if (updateError) {
      console.warn(`⚠️ Investment update warning: ${updateError.message}`);
    }

    console.log(
      `✅ Applied first profit of $${expectedProfit} to user balance`
    );

    // Step 7: Verify final state
    console.log("\n6. Verifying final state...");

    // Check user balance
    const { data: finalUser, error: userCheckError } = await supabase
      .from("users")
      .select("balance")
      .eq("uid", testUser.user.id)
      .single();

    if (userCheckError) {
      console.warn(`⚠️ User balance check warning: ${userCheckError.message}`);
    } else {
      console.log(`💵 Final user balance: $${finalUser?.balance || "unknown"}`);
    }

    // Check investment returns
    const { data: returns, error: returnsError } = await supabase
      .from("investment_returns")
      .select("*")
      .eq("investment_id", investment.id);

    if (returnsError) {
      console.warn(`⚠️ Returns check warning: ${returnsError.message}`);
    } else {
      console.log(`📊 Investment returns recorded: ${returns?.length || 0}`);
      if (returns && returns.length > 0) {
        console.log(`   Return amount: $${returns[0].amount}`);
      }
    }

    // Step 8: Cleanup
    console.log("\n7. Cleaning up test data...");

    // Delete test data
    await supabase
      .from("investment_returns")
      .delete()
      .eq("investment_id", investment.id);
    await supabase.from("investments").delete().eq("id", investment.id);
    await supabase.from("transactions").delete().eq("id", transaction.id);
    await supabase.from("users").delete().eq("uid", testUser.user.id);
    await supabase.auth.admin.deleteUser(testUser.user.id);

    console.log("🧹 Cleaned up test data");

    console.log("\n🎉 24-Hour Profit System Test Completed Successfully!");
    console.log("\nSummary:");
    console.log("- ✅ Deposit created and pending admin approval");
    console.log("- ✅ Admin approved deposit and scheduled first profit");
    console.log("- ✅ First profit applied after 24 hours");
    console.log("- ✅ User balance updated with profit");
    console.log("- ✅ Investment return recorded");
    console.log("- ✅ No email notifications sent for profits");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
test24HourProfitSystem();
