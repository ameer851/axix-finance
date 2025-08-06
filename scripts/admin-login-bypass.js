// admin-login-bypass.js - A tool to bypass normal login for admin only
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
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ""
);

async function getAdminUserDetails() {
  try {
    console.log("🔍 Fetching admin user details...");

    // Get admin from users table
    const { data: adminUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@axixfinance.com")
      .maybeSingle();

    if (userError) {
      console.error("❌ Error fetching admin user:", userError);
      return null;
    }

    if (!adminUser) {
      console.log("⚠️ Admin user not found in users table");
      return null;
    }

    console.log("✅ Found admin user in database with ID:", adminUser.id);

    // Get admin from auth.users table
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(adminUser.uid);

    if (authError) {
      console.error("❌ Error fetching admin auth user:", authError);
      return null;
    }

    if (!authUser) {
      console.log("⚠️ Admin auth user not found");
      return null;
    }

    console.log("✅ Found admin auth user with UID:", authUser.user.id);

    // Return full admin details
    return {
      user: adminUser,
      auth: authUser.user,
    };
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return null;
  }
}

async function createAdminLoginSession() {
  try {
    console.log("🔑 Attempting to create admin login session...");

    // Sign in as admin
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@axixfinance.com",
      password: "admin123",
    });

    if (error) {
      console.error("❌ Error signing in as admin:", error);
      return null;
    }

    if (!data.session) {
      console.error("❌ No session created");
      return null;
    }

    console.log("✅ Created admin session successfully");
    console.log(
      "🔒 Session expires at:",
      new Date(data.session.expires_at * 1000).toLocaleString()
    );

    return {
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return null;
  }
}

async function main() {
  console.log("🔧 Admin Login Helper");

  // Get admin user details
  const adminDetails = await getAdminUserDetails();

  if (!adminDetails) {
    console.error("\n❌ Failed to get admin details");
    console.log(
      "Please run fix-admin-account.js first to ensure admin account exists"
    );
    return;
  }

  console.log("\n📊 Admin User Details:");
  console.log("- ID:", adminDetails.user.id);
  console.log("- UID:", adminDetails.user.uid);
  console.log("- Email:", adminDetails.user.email);
  console.log("- Username:", adminDetails.user.username);
  console.log("- Role:", adminDetails.user.role);
  console.log("- Is Active:", adminDetails.user.is_active ? "Yes ✅" : "No ❌");
  console.log(
    "- Is Verified:",
    adminDetails.user.is_verified ? "Yes ✅" : "No ❌"
  );
  console.log("- Is Admin:", adminDetails.user.is_admin ? "Yes ✅" : "No ❌");

  // Create admin login session
  console.log("\nAttempting to create admin login session...");
  const session = await createAdminLoginSession();

  if (!session) {
    console.error("\n❌ Failed to create admin login session");
    console.log("Please check the errors above and try again");
    return;
  }

  console.log("\n✅ Admin login session created successfully!");
  console.log("🔑 Access Token:", session.token.substring(0, 20) + "...");
  console.log(
    "⏰ Expires At:",
    new Date(session.expiresAt * 1000).toLocaleString()
  );

  console.log("\n👉 Try logging in now with:");
  console.log("   Username: admin@axixfinance.com");
  console.log("   Password: admin123");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
