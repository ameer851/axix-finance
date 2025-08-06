// fix-admin-account.js - Script to create or repair admin account
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

// Fix admin account function
async function fixAdminAccount() {
  try {
    console.log("🔍 Checking for existing admin account...");

    // Check if admin account exists
    const { data: existingAdmin, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@axixfinance.com")
      .maybeSingle(); // Use maybeSingle to avoid error if no results

    if (fetchError) {
      console.error("❌ Error checking admin account:", fetchError);
      return false;
    }

    if (existingAdmin) {
      console.log("✅ Admin account exists with ID:", existingAdmin.id);

      // Update existing admin to ensure it's active and verified
      const { data: updatedAdmin, error: updateError } = await supabase
        .from("users")
        .update({
          is_active: true,
          is_verified: true,
          is_admin: true,
        })
        .eq("id", existingAdmin.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating admin account:", updateError);
        return false;
      }

      console.log("✅ Successfully updated admin account status:", {
        is_active: updatedAdmin.is_active,
        is_verified: updatedAdmin.is_verified,
        is_admin: updatedAdmin.is_admin,
      });

      return true;
    } else {
      console.log("⚠️ Admin account does not exist. Attempting to create...");

      // Try to sign in to the admin account instead of creating it
      console.log("🔍 Attempting to sign in to existing admin account...");
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: "admin@axixfinance.com",
          password: "admin123",
        });

      if (authError) {
        console.error("❌ Error signing in to admin account:", authError);

        // If sign-in fails, try to create the account anyway
        console.log("🔄 Attempting to create admin auth account instead...");
        const { data: newAuthData, error: newAuthError } =
          await supabase.auth.signUp({
            email: "admin@axixfinance.com",
            password: "admin123",
            options: {
              data: {
                username: "admin",
                first_name: "Admin",
                last_name: "User",
              },
            },
          });

        if (newAuthError) {
          console.error("❌ Error creating admin auth user:", newAuthError);
          return false;
        }

        if (!newAuthData.user?.id) {
          console.error("❌ Failed to get UID from auth creation");
          return false;
        }

        console.log("✅ Created auth user with UID:", newAuthData.user.id);

        // Use the newly created auth user's ID
        var uid = newAuthData.user.id;
      } else {
        console.log("✅ Successfully signed in to admin account");

        if (!authData.user?.id) {
          console.error("❌ Failed to get UID from sign-in");
          return false;
        }

        console.log("✅ Got admin auth UID:", authData.user.id);

        // Use the existing auth user's ID
        var uid = authData.user.id;
      }

      // Now create the admin profile in the users table
      const { data: newAdmin, error: insertError } = await supabase
        .from("users")
        .insert({
          uid: uid, // Using the uid variable we set above
          email: "admin@axixfinance.com",
          username: "admin",
          first_name: "Admin",
          last_name: "User",
          role: "admin",
          is_admin: true,
          is_active: true,
          is_verified: true,
          balance: "0",
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Error creating admin profile:", insertError);
        return false;
      }

      console.log("✅ Created admin profile with ID:", newAdmin.id);
      return true;
    }
  } catch (error) {
    console.error("❌ Unexpected error in fixAdminAccount:", error);
    return false;
  }
}

// Main function
async function main() {
  console.log("🔧 Starting admin account repair...");

  const success = await fixAdminAccount();

  if (success) {
    console.log("\n✅ Admin account setup completed successfully!");
    console.log(
      "🔑 You should now be able to log in with admin@axixfinance.com"
    );
    console.log("🛡️ Default password is 'admin123'");
  } else {
    console.error("\n❌ Failed to setup admin account properly");
    console.log("Please check the errors above and try again");
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
