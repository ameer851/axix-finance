import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc"
);

async function checkUsers() {
  try {
    console.log("🔍 Checking existing users in database...");

    // Check users table
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("id");

    if (error) {
      console.error("❌ Error fetching users:", error);
      return;
    }

    if (!users || users.length === 0) {
      console.log("⚠️ No users found in database");
      console.log("💡 This explains the 'Invalid username or password' error");
      console.log("🔧 You need to create at least one user to test login");
      return;
    }

    console.log(`✅ Found ${users.length} users:`);
    console.log("\n-------------------------------------------------");
    console.log("| ID | Username | Email | Role | Active | Verified |");
    console.log("-------------------------------------------------");

    for (const user of users) {
      console.log(
        `| ${user.id} | ${(user.username || "N/A").padEnd(10)} | ${(user.email || "N/A").substring(0, 20).padEnd(20)} | ${(user.role || "user").padEnd(4)} | ${user.isActive ? "Yes ✅" : "No ❌"} | ${user.isVerified ? "Yes ✅" : "No ❌"} |`
      );
    }

    console.log("-------------------------------------------------");

    // Check for admin users specifically
    const adminUsers = users.filter((u) => u.role === "admin");
    if (adminUsers.length === 0) {
      console.log("\n⚠️ No admin users found");
      console.log("💡 You need an admin user to access admin panel");
    } else {
      console.log(`\n✅ Found ${adminUsers.length} admin user(s)`);
    }

    // Check for inactive users
    const inactiveUsers = users.filter((u) => !u.isActive);
    if (inactiveUsers.length > 0) {
      console.log(`\n⚠️ Found ${inactiveUsers.length} inactive user(s):`);
      inactiveUsers.forEach((u) => {
        console.log(`   - ${u.username || u.email} (ID: ${u.id})`);
      });
    }

    // Check for unverified users
    const unverifiedUsers = users.filter((u) => !u.isVerified);
    if (unverifiedUsers.length > 0) {
      console.log(`\n⚠️ Found ${unverifiedUsers.length} unverified user(s):`);
      unverifiedUsers.forEach((u) => {
        console.log(`   - ${u.username || u.email} (ID: ${u.id})`);
      });
    }

    console.log("\n🔧 To fix login issues:");
    console.log("1. If no users exist, create a test user");
    console.log("2. If users are inactive, activate them");
    console.log("3. If users are unverified, verify them");
    console.log("4. Make sure passwords are properly hashed");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkUsers();
