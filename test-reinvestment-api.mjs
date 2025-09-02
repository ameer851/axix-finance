#!/usr/bin/env node

/**
 * Test reinvestment API endpoint for user ID 24
 */

import fetch from "node-fetch";

const API_BASE_URL = "http://localhost:4000"; // Default port from .env

async function testReinvestmentAPI() {
  try {
    console.log("=== Testing Reinvestment API for User ID 24 ===\n");

    // First, let's check if we can get user data (this might require authentication)
    console.log("1. Testing user authentication and data retrieval...");

    // Use the generated test JWT token for user ID 24
    const testToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VySWQiOjI0LCJpYXQiOjE3NTY3Nzk1MjksImV4cCI6MTc1Njg2NTkyOSwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.ki8P1PsRB76uGoEXsCYB5f8oLsD9bOIPNttFohpm3H4";

    // Test reinvestment with $100 and STARTER PLAN
    const reinvestData = {
      amount: 100,
      planName: "STARTER PLAN",
    };

    console.log("2. Testing reinvestment endpoint...");
    console.log(`Amount: $${reinvestData.amount}`);
    console.log(`Plan: ${reinvestData.planName}`);

    const response = await fetch(`${API_BASE_URL}/api/transactions/reinvest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(reinvestData),
    });

    console.log(`Response Status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Reinvestment successful!");
      console.log("Response:", JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log("❌ Reinvestment failed:");
      console.log("Error:", errorText);

      // If it's an auth error, let's try without auth to see the endpoint
      if (response.status === 401) {
        console.log("\n3. Testing endpoint without authentication...");
        const noAuthResponse = await fetch(
          `${API_BASE_URL}/api/transactions/reinvest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(reinvestData),
          }
        );
        console.log(`No-auth Response Status: ${noAuthResponse.status}`);
        const noAuthError = await noAuthResponse.text();
        console.log("No-auth Error:", noAuthError);
      }
    }
  } catch (error) {
    console.error("Test failed:", error.message);

    // Check if server is running
    console.log("\nChecking if server is accessible...");
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      if (healthResponse.ok) {
        console.log("✅ Server is running and accessible");
      } else {
        console.log("❌ Server health check failed");
      }
    } catch (healthError) {
      console.log("❌ Cannot connect to server:", healthError.message);
      console.log("Make sure the server is running on the correct port");
    }
  }
}

// Run the test
testReinvestmentAPI();
