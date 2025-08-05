// fix-admin.js - Ensures admin user exists and has proper permissions
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

// Admin user details
const adminUser = {
  email: "admin@axixfinance.com",
  username: "admin",
  firstName: "Admin",
  lastName: "User",
  password: "admin",
  role: "admin",
  isVerified: true,
  isActive: true,
};

// Update or create the admin user
async function updateAdminUser() {
  try {
    console.log("✅ Connected to database");

    // Check if admin user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", adminUser.email)
      .single();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    // Hash the password - we're going to use plain password field in this schema
    const hashedPassword = adminUser.password; // In a real app, this would be hashed

    if (user) {
      // Update existing admin user
      const adminId = user.id;

      const { error: updateError } = await supabase
        .from("users")
        .update({
          role: adminUser.role,
          is_verified: adminUser.isVerified,
          is_active: adminUser.isActive,
          password: hashedPassword,
          username: adminUser.username,
          first_name: adminUser.firstName,
          last_name: adminUser.lastName,
        })
        .eq("id", adminId);

      if (updateError) throw updateError;

      console.log(`✅ Admin user updated successfully`);
    } else {
      // Create new admin user
      const { error: insertError } = await supabase.from("users").insert([
        {
          email: adminUser.email,
          username: adminUser.username,
          first_name: adminUser.firstName,
          last_name: adminUser.lastName,
          password: hashedPassword,
          role: adminUser.role,
          is_verified: adminUser.isVerified,
          is_active: adminUser.isActive,
        },
      ]);

      if (insertError) throw insertError;

      console.log(`✅ Admin user created successfully`);
    }

    // Create audit log
    const { error: logError } = await supabase.from("logs").insert([
      {
        type: "audit",
        message: "Admin user updated",
        details: '{"action":"script_execution","script":"fix-admin.js"}',
      },
    ]);

    if (logError) throw logError;

    console.log("✅ Created audit log to document the change");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

async function main() {
  console.log("🔧 Starting admin user update...");

  // Update the admin user
  await updateAdminUser();

  console.log("\n🔧 Update complete! Admin user is ready to use.");
  console.log("🔑 Login with:", adminUser.email, "/", adminUser.password);
}

main();
