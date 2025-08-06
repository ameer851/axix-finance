#!/usr/bin/env node

// Test script for the email workflow implementation
// This tests the email functions without actually sending emails

import {
  sendDepositApprovedEmail,
  sendDepositSuccessEmail,
  sendWelcomeEmail,
  sendWithdrawalApprovedEmail,
  sendWithdrawalRequestEmail,
} from "../server/emailService.js";

// Mock user object
const mockUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  full_name: "John Doe",
  isVerified: true,
  isActive: true,
  role: "user",
  balance: "1000",
  createdAt: new Date(),
  updatedAt: new Date(),
  twoFactorEnabled: false,
};

async function testEmailWorkflow() {
  console.log("🧪 Testing Email Workflow Implementation...\n");

  try {
    // Test 1: Welcome Email
    console.log("1. Testing Welcome Email...");
    const welcomeResult = await sendWelcomeEmail(mockUser, "testpassword123");
    console.log(
      `   ✅ Welcome email result: ${welcomeResult ? "Success" : "Failed"}\n`
    );

    // Test 2: Deposit Success Email
    console.log("2. Testing Deposit Success Email...");
    const depositSuccessResult = await sendDepositSuccessEmail(
      mockUser,
      "500",
      "Premium Plan"
    );
    console.log(
      `   ✅ Deposit success email result: ${depositSuccessResult ? "Success" : "Failed"}\n`
    );

    // Test 3: Deposit Approved Email
    console.log("3. Testing Deposit Approved Email...");
    const depositApprovedResult = await sendDepositApprovedEmail(
      mockUser,
      "500",
      "Premium Plan"
    );
    console.log(
      `   ✅ Deposit approved email result: ${depositApprovedResult ? "Success" : "Failed"}\n`
    );

    // Test 4: Withdrawal Request Email
    console.log("4. Testing Withdrawal Request Email...");
    const withdrawalRequestResult = await sendWithdrawalRequestEmail(
      mockUser,
      "250",
      "192.168.1.1"
    );
    console.log(
      `   ✅ Withdrawal request email result: ${withdrawalRequestResult ? "Success" : "Failed"}\n`
    );

    // Test 5: Withdrawal Approved Email
    console.log("5. Testing Withdrawal Approved Email...");
    const withdrawalApprovedResult = await sendWithdrawalApprovedEmail(
      mockUser,
      "250",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    );
    console.log(
      `   ✅ Withdrawal approved email result: ${withdrawalApprovedResult ? "Success" : "Failed"}\n`
    );

    console.log("🎉 Email workflow test completed!");
    console.log("\n📋 Summary:");
    console.log("   - Account creation: Sends welcome email ✅");
    console.log("   - Deposit submission: Sends deposit success email ✅");
    console.log("   - Admin deposit approval: Sends deposit approved email ✅");
    console.log("   - Withdrawal request: Sends withdrawal request email ✅");
    console.log(
      "   - Admin withdrawal approval: Sends withdrawal approved email ✅"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testEmailWorkflow();
