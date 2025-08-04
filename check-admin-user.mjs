import { createClient } from "@supabase/supabase-js";

// Supabase configuration from environment
const supabaseUrl = "https://wvnyiinrmfysabsfztii.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDM2NywiZXhwIjoyMDY4NjcwMzY3fQ.zLhFm0aPCDfbUQHWWdPJeRfXaI06JP1sHzfGdHM0n9g";

// Create a Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateAdminUser() {
  console.log("Checking for admin user...");

  try {
    // Check if admin user exists
    const { data: existingUsers, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", "admin")
      .eq("role", "admin");

    if (error) {
      console.error("Error checking for admin user:", error);
      return;
    }

    console.log("Found existing admin users:", existingUsers?.length || 0);

    if (!existingUsers || existingUsers.length === 0) {
      console.log("Creating admin user...");

      // Create the admin user
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            username: "admin",
            email: "admin@axixfinance.com",
            password: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG", // Hashed password
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            isVerified: true,
            isActive: true,
            balance: "0",
          },
        ])
        .select();

      if (createError) {
        console.error("Error creating admin user:", createError);
        return;
      }

      console.log("Admin user created successfully:", newUser);
    } else {
      console.log("Admin user already exists:", existingUsers[0]);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

// Run the function
checkAndCreateAdminUser();
