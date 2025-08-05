// fix-admin-users.js - Makes sure admin user exists and all users are verified
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
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

// Update or create admin user
async function ensureAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash("admin", 10);

    // Ensure admin user exists
    const { data: adminUser, error: adminUserError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@axixfinance.com")
      .single();

    if (adminUserError && adminUserError.code !== "PGRST116") {
      console.error("Error fetching admin user:", adminUserError);
      return;
    }

    if (!adminUser) {
      const { error: createError } = await supabase.from("users").insert({
        email: "admin@axixfinance.com",
        password: hashedPassword,
        role: "admin",
        is_verified: true,
      });

      if (createError) {
        console.error("Error creating admin user:", createError);
        return;
      }

      console.log("Admin user created successfully.");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Ensure all users are verified and active
async function verifyAllUsers() {
  // Update all users to be verified and active
  const { error } = await supabase
    .from("users")
    .update({ is_verified: true, is_active: true });

  if (error) {
    console.error("❌ Error verifying users:", error);
  } else {
    console.log("✅ All users have been updated to verified and active");
  }
}

// Fix or create visitor_tracking table if needed
async function ensureVisitorTrackingTable() {
  // Check if visitor_tracking table exists
  const { data: tables, error: tablesError } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_name", "visitor_tracking")
    .single();

  if (tablesError && tablesError.code !== "PGRST116") {
    console.error("❌ Error checking visitor_tracking table:", tablesError);
    return;
  }

  if (!tables) {
    console.log("⚠️ visitor_tracking table does not exist, creating it...");

    // Create the visitor_tracking table
    const { error: createTableError } = await supabase.rpc(
      "create_visitor_tracking_table"
    );

    if (createTableError) {
      console.error(
        "❌ Error creating visitor_tracking table:",
        createTableError
      );
    } else {
      console.log("✅ Created visitor_tracking table");
    }
  } else {
    console.log("✅ visitor_tracking table exists");
  }
}

async function main() {
  console.log("🔧 Starting admin user and verification setup...");

  try {
    // Ensure admin user exists
    await ensureAdminUser();

    // Verify all users
    await verifyAllUsers();

    // Ensure visitor tracking table exists
    await ensureVisitorTrackingTable();

    console.log("\n🔧 Setup complete! All users are now verified and active.");
    console.log(
      "🔑 Admin user is set up with email: admin@axixfinance.com and password: admin"
    );
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
