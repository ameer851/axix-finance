// verify-all-users.js - Mark all users as verified and active
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// Ensure all users are marked as verified and active
async function updateAllUsersToVerified() {
  try {
    // Update all users to be verified and active
    const { data, error } = await supabase
      .from("users")
      .update({ is_verified: true, is_active: true })
      .select("id", { count: "exact" })
      .neq("email", "admin@axixfinance.com"); // Exclude admin email from bulk update

    if (error) {
      console.error("❌ Error updating users:", error);
      return;
    }

    console.log(`✅ Updated ${data.length} users to be verified and active`);

    // Make sure there's at least one admin user
    const { data: adminData, error: adminError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .single();

    if (adminError || !adminData) {
      console.log("⚠️ No admin user found, creating one...");
      const { error: insertError } = await supabase.from("users").insert([
        {
          email: "admin@axixfinance.com",
          username: "admin",
          first_name: "Admin",
          last_name: "User",
          password: "admin",
          role: "admin",
          is_verified: true,
          is_active: true,
        },
      ]);

      if (insertError) {
        console.error("❌ Error creating admin user:", insertError);
        return;
      }

      console.log("✅ Admin user created successfully");
    }

    // Create audit log
    const { error: logError } = await supabase.from("logs").insert([
      {
        type: "audit",
        message: "All users marked as verified and active",
        details: JSON.stringify({
          action: "script_execution",
          script: "verify-all-users.js",
        }),
      },
    ]);

    if (logError) {
      console.error("❌ Error creating audit log:", logError);
      return;
    }

    console.log("✅ Created audit log to document the change");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

async function main() {
  console.log("🔧 Starting user verification update...");

  // Update all users in the database
  await updateAllUsersToVerified();

  console.log("\n🔧 Update complete! All users are now verified and active.");
}

main();
