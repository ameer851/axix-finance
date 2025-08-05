import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing required environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdmin() {
  try {
    console.log("Starting admin setup...");

    // Check if admin user exists in Auth
    const { data: existingUser, error: userError } =
      await supabase.auth.admin.getUserByEmail("admin@axixfinance.com");

    if (userError) {
      console.log("Admin user does not exist in Auth, creating...");

      // Create admin user in Auth
      const { data: auth, error: createError } =
        await supabase.auth.admin.createUser({
          email: "admin@axixfinance.com",
          password: "Axix-Admin@123",
          email_confirm: true,
        });

      if (createError) {
        throw new Error(
          `Failed to create admin auth account: ${createError.message}`
        );
      }

      if (!auth.user) {
        throw new Error("Failed to create admin user - no user data returned");
      }

      // Create admin profile in users table
      const { error: profileError } = await supabase.from("users").insert([
        {
          uid: auth.user.id,
          email: "admin@axixfinance.com",
          full_name: "Admin User",
          role: "admin",
          is_admin: true,
        },
      ]);

      if (profileError) {
        throw new Error(
          `Failed to create admin profile: ${profileError.message}`
        );
      }

      console.log("✅ Admin user created successfully!");
    } else {
      console.log("Admin user already exists in Auth");

      // Check if admin profile exists in users table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("email", "admin@axixfinance.com")
        .single();

      if (profileError || !profile) {
        console.log("Creating admin profile in users table...");

        // Create admin profile in users table
        const { error: insertError } = await supabase.from("users").insert([
          {
            uid: existingUser.id,
            email: "admin@axixfinance.com",
            full_name: "Admin User",
            role: "admin",
            is_admin: true,
          },
        ]);

        if (insertError) {
          throw new Error(
            `Failed to create admin profile: ${insertError.message}`
          );
        }

        console.log("✅ Admin profile created successfully!");
      } else {
        console.log("✅ Admin user and profile already exist");
      }
    }
  } catch (error) {
    console.error("❌ Error setting up admin:", error);
    process.exit(1);
  }
}

setupAdmin();
