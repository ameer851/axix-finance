// direct-admin-fix.js - Direct SQL script to activate admin account
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Initialize Supabase client with admin privileges
const supabase = createClient(
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ""
);

async function listAllUsers() {
  try {
    console.log("📋 Listing all users in the database...");

    // Query all users
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, username, role, is_active, is_verified, is_admin")
      .order("id");

    if (error) {
      console.error("❌ Error listing users:", error);
      return;
    }

    if (!users || users.length === 0) {
      console.log("⚠️ No users found in the database");
      return;
    }

    console.log(`✅ Found ${users.length} users:`);

    // Display user information in a table format
    console.log("\n-------------------------------------------------");
    console.log("| ID | Email | Role | Active | Verified | Admin |");
    console.log("-------------------------------------------------");

    for (const user of users) {
      console.log(
        `| ${user.id} | ${user.email.substring(0, 20).padEnd(20)} | ${
          user.role
        } | ${user.is_active ? "Yes ✅" : "No ❌"} | ${
          user.is_verified ? "Yes ✅" : "No ❌"
        } | ${user.is_admin ? "Yes ✅" : "No ❌"} |`
      );
    }

    console.log("-------------------------------------------------");

    return users;
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

async function activateAdmin() {
  try {
    console.log("🔧 Looking for admin account to activate...");

    // Find any admin users
    const { data: adminUsers, error: findError } = await supabase
      .from("users")
      .select("id, email, username, role, is_active, is_verified, is_admin")
      .eq("role", "admin");

    if (findError) {
      console.error("❌ Error finding admin users:", findError);
      return false;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log("⚠️ No admin users found");
      return false;
    }

    console.log(`✅ Found ${adminUsers.length} admin users`);

    // Activate all admin users
    let successCount = 0;
    for (const admin of adminUsers) {
      console.log(`🔄 Activating admin user: ${admin.email}`);

      const { data, error } = await supabase
        .from("users")
        .update({
          is_active: true,
          is_verified: true,
          is_admin: true,
        })
        .eq("id", admin.id)
        .select();

      if (error) {
        console.error(`❌ Error activating admin user ${admin.id}:`, error);
      } else {
        console.log(`✅ Successfully activated admin user: ${admin.email}`);
        successCount++;
      }
    }

    return successCount > 0;
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return false;
  }
}

async function main() {
  console.log("🔧 Direct Admin Fix Tool");
  console.log("------------------------");

  // List all users
  await listAllUsers();

  // Activate admin accounts
  console.log("\nAttempting to activate admin account(s)...");
  const success = await activateAdmin();

  if (success) {
    console.log("\n✅ Admin account(s) activated successfully!");
    console.log("🔑 You should now be able to log in with admin credentials");

    // Show updated user list
    console.log("\nUpdated user list:");
    await listAllUsers();
  } else {
    console.log("\n❌ Failed to activate any admin accounts");
    console.log("Please check the errors above and try again");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
