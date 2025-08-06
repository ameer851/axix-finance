// create-admin-via-api.js - Create admin account via API endpoint
import fetch from "node-fetch";

async function createAdminAccount() {
  try {
    console.log("🔧 Creating admin account via API endpoint...");

    // First check if the API is available
    console.log("🔍 Checking API availability...");
    const healthCheck = await fetch("http://localhost:4000/api/health");

    if (!healthCheck.ok) {
      throw new Error(`API health check failed: ${healthCheck.status}`);
    }

    console.log("✅ API is available");

    // Create admin account using the admin setup endpoint
    console.log("🔑 Creating admin account...");
    const response = await fetch("http://localhost:4000/api/admin/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@axixfinance.com",
        password: "admin123",
        apiKey: "setup-admin-axixfinance", // This is just for added security
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `Failed to create admin account: ${response.status} - ${JSON.stringify(result)}`
      );
    }

    console.log("✅ Admin account created successfully!");
    console.log(result);

    return true;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

// Run the function
createAdminAccount()
  .then((success) => {
    if (success) {
      console.log("\n👉 You can now log in with:");
      console.log("   Email: admin@axixfinance.com");
      console.log("   Password: admin123");
    } else {
      console.log("\n❌ Failed to create admin account");
      console.log(
        "Please ensure the API server is running at http://localhost:4000"
      );
    }
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
