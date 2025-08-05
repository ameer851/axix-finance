import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Initialize Supabase client with auth config
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function updateAdmin() {
  try {
    console.log("Starting admin user setup...");

    // First, try to get existing admin user from the users table
    const { data: existingUsers, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@axixfinance.com");

    if (fetchError) {
      console.error("Error checking for existing admin:", fetchError);
      return;
    }

    // Then, try to get or create the auth user
    let authUser;
    try {
      const {
        data: { user },
        error: createError,
      } = await supabase.auth.admin.createUser({
        email: "admin@axixfinance.com",
        password: "Axix-Admin@123",
        email_confirm: true,
        user_metadata: {
          role: "admin",
          is_admin: true,
        },
      });

      if (createError) {
        if (createError.message.includes("already been registered")) {
          console.log("Auth user exists, retrieving...");
          const {
            data: { users },
            error: getUserError,
          } = await supabase.auth.admin.listUsers();
          if (getUserError) {
            console.error("Error getting auth users:", getUserError);
            return;
          }
          authUser = users.find((u) => u.email === "admin@axixfinance.com");
        } else {
          console.error("Error creating auth user:", createError);
          return;
        }
      } else {
        authUser = user;
      }
    } catch (error) {
      console.error("Error in auth operations:", error);
      return;
    }

    if (!authUser) {
      console.error("Could not create or find auth user");
      return;
    }

    // Now handle the profile in the users table
    if (existingUsers && existingUsers.length > 0) {
      console.log("Updating existing admin user profile...");

      // If we have multiple admin users, keep only the first one
      if (existingUsers.length > 1) {
        console.log(
          `Found ${existingUsers.length} admin users. Cleaning up duplicates...`
        );
        const [keepUser, ...duplicates] = existingUsers;

        const { error: deleteError } = await supabase
          .from("users")
          .delete()
          .in(
            "id",
            duplicates.map((u) => u.id)
          );

        if (deleteError) {
          console.error("Error deleting duplicate admin users:", deleteError);
          return;
        }
        console.log(`Deleted ${duplicates.length} duplicate admin users`);
      }

      // Update the remaining admin user
      const updateData = {
        role: "admin",
        is_admin: true,
        uid: authUser.id,
        email: "admin@axixfinance.com",
        full_name: "Admin User",
      };

      const { error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", existingUsers[0].id);

      if (updateError) {
        console.error("Error updating admin user:", updateError);
        return;
      }

      console.log("Admin user updated successfully!");
    } else {
      console.log("Creating new admin user profile...");

      // Create new admin user profile
      const { error: createError } = await supabase.from("users").insert([
        {
          uid: authUser.id,
          email: "admin@axixfinance.com",
          full_name: "Admin User",
          is_admin: true,
          role: "admin",
        },
      ]);

      if (createError) {
        console.error("Error creating admin user profile:", createError);
        return;
      }

      console.log("Admin user profile created successfully!");
    }

    console.log("\nAdmin setup completed successfully!");
    console.log("Login credentials:");
    console.log("Email: admin@axixfinance.com");
    console.log("Password: Axix-Admin@123");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

updateAdmin();
