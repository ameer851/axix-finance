import fetch from "node-fetch";

// Supabase configuration
const supabaseUrl = "https://wvnyiinrmfysabsfztii.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDM2NywiZXhwIjoyMDY4NjcwMzY3fQ.zLhFm0aPCDfbUQHWWdPJeRfXaI06JP1sHzfGdHM0n9g";

// Test Supabase connection directly using REST API
async function testSupabaseDirectConnection() {
  console.log("Testing direct connection to Supabase REST API...");
  console.log(`URL: ${supabaseUrl}`);

  // Test with anon key
  try {
    console.log("\nTesting with ANON key:");
    const anonResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?select=*&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Status: ${anonResponse.status}`);
    console.log(`Status Text: ${anonResponse.statusText}`);

    const headers = {};
    anonResponse.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("Headers:", headers);

    if (anonResponse.ok) {
      const data = await anonResponse.json();
      console.log("Response data:", data);
    } else {
      const errorText = await anonResponse.text();
      console.error("Error response:", errorText);
    }
  } catch (error) {
    console.error("Error testing anon key:", error);
  }

  // Test with service role key
  try {
    console.log("\nTesting with SERVICE_ROLE key:");
    const serviceResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?select=*&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Status: ${serviceResponse.status}`);
    console.log(`Status Text: ${serviceResponse.statusText}`);

    const headers = {};
    serviceResponse.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("Headers:", headers);

    if (serviceResponse.ok) {
      const data = await serviceResponse.json();
      console.log("Response data:", data);
    } else {
      const errorText = await serviceResponse.text();
      console.error("Error response:", errorText);
    }
  } catch (error) {
    console.error("Error testing service role key:", error);
  }
}

// Run the test
testSupabaseDirectConnection();
