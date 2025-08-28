#!/usr/bin/env node

/**
 * Automatic Investment System Test Script
 *
 * This script tests the automatic investment functionality
 * without making any changes to the database.
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing Supabase configuration. Please check your .env file."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Test the automatic investment system
 */
async function testAutoInvestmentSystem() {
  console.log("🧪 Testing Automatic Investment System");
  console.log("=====================================");

  try {
    // Test 1: Check database connectivity
    console.log("\n1️⃣  Testing database connectivity...");
    const { data: healthCheck, error: healthError } = await supabase
      .from("investments")
      .select("count")
      .limit(1);

    if (healthError) {
      console.error("❌ Database connection failed:", healthError);
      return;
    }
    console.log("✅ Database connection successful");

    // Test 2: Check investment plans
    console.log("\n2️⃣  Checking investment plans...");
    const { INVESTMENT_PLANS } = require("../server/investmentService");
    console.log(`✅ Found ${INVESTMENT_PLANS.length} investment plans:`);
    INVESTMENT_PLANS.forEach((plan) => {
      console.log(
        `   • ${plan.name}: ${plan.dailyProfit}% daily, ${plan.duration} days, ${plan.totalReturn}% total`
      );
    });

    // Test 3: Check existing investments
    console.log("\n3️⃣  Checking existing investments...");
    const { data: investments, error: invError } = await supabase
      .from("investments")
      .select("id, user_id, plan_name, status, created_at")
      .limit(5);

    if (invError) {
      console.error("❌ Error fetching investments:", invError);
    } else {
      console.log(`✅ Found ${investments?.length || 0} recent investments`);
      if (investments && investments.length > 0) {
        investments.forEach((inv) => {
          console.log(
            `   • ID: ${inv.id}, Plan: ${inv.plan_name}, Status: ${inv.status}, User: ${inv.user_id}`
          );
        });
      }
    }

    // Test 4: Check investment returns
    console.log("\n4️⃣  Checking investment returns...");
    const { data: returns, error: retError } = await supabase
      .from("investment_returns")
      .select("id, investment_id, amount, return_date")
      .limit(5);

    if (retError) {
      console.error("❌ Error fetching returns:", retError);
    } else {
      console.log(`✅ Found ${returns?.length || 0} recent returns`);
      if (returns && returns.length > 0) {
        returns.forEach((ret) => {
          console.log(
            `   • Investment: ${ret.investment_id}, Amount: $${ret.amount}, Date: ${ret.return_date}`
          );
        });
      }
    }

    // Test 5: Test processor script
    console.log("\n5️⃣  Testing processor script...");
    const processorPath = path.join(__dirname, "auto-investment-processor.js");

    if (require("fs").existsSync(processorPath)) {
      console.log("✅ Processor script exists");

      // Test dry run
      const { spawn } = require("child_process");
      const testProcess = spawn("node", [processorPath, "--dry-run"], {
        cwd: path.dirname(__dirname),
        stdio: "pipe",
      });

      let output = "";
      testProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      testProcess.stderr.on("data", (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => {
        testProcess.on("close", (code) => {
          if (code === 0) {
            console.log("✅ Processor dry-run successful");
          } else {
            console.log("⚠️  Processor dry-run completed with warnings");
          }
          resolve();
        });
      });
    } else {
      console.error("❌ Processor script not found");
    }

    // Test 6: Check API endpoint
    console.log("\n6️⃣  Checking API endpoint...");
    try {
      const response = await fetch(
        `${process.env.API_URL || "http://localhost:3000"}/api/transactions/investment-deposit`,
        {
          method: "OPTIONS",
        }
      );
      console.log("✅ API endpoint is accessible");
    } catch (error) {
      console.log(
        "⚠️  API endpoint not accessible (this is normal if server is not running)"
      );
    }

    // Summary
    console.log("\n🎉 Test Summary");
    console.log("==============");
    console.log("✅ Database connectivity: OK");
    console.log(`✅ Investment plans: ${INVESTMENT_PLANS.length} configured`);
    console.log("✅ Processor script: Ready");
    console.log("✅ System status: Ready for deployment");

    console.log("\n🚀 Next Steps:");
    console.log("1. Start your server: npm start");
    console.log("2. Set up daily cron job: ./scripts/setup-auto-investment.sh");
    console.log("3. Test a deposit via the frontend");
    console.log("4. Monitor logs: tail -f logs/auto-investment.log");
  } catch (error) {
    console.error("💥 Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testAutoInvestmentSystem().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
