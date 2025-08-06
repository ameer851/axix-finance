import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with your project URL and anon key
const supabase = createClient(
  "https://oyqanlnqfyyaqheehsmw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc"
);

async function activateAdmin() {
  try {
    // First check if admin exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("username", "admin")
      .single();

    if (checkError || !existingAdmin) {
      console.log("Creating new admin account...");
      // Create new admin account if it doesn't exist
      const { data: newAdmin, error: createError } = await supabase
        .from("users")
        .upsert({
          username: "admin",
          email: "admin@axixfinance.com",
          password: "Axix-Admin@1239",
          role: "admin",
          is_active: true,
          is_verified: true,
          full_name: "Admin User",
          balance: "0",
        })
        .select();

      if (createError) {
        console.error("Error creating admin:", createError.message);
        return;
      }
      console.log("✅ Created new admin account");
    }

    // Now update the admin account to ensure it's active
    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: true,
        is_verified: true,
        role: "admin",
      })
      .eq("username", "admin")
      .select();

    if (error) {
      console.error("Error updating admin by username:", error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log("✅ Successfully activated admin account");
      console.log("Account details:", data[0]);
    } else {
      // If no rows updated by username, try by email
      const { data: emailData, error: emailError } = await supabase
        .from("users")
        .update({
          is_active: true,
          is_verified: true,
        })
        .eq("email", "admin@axixfinance.com")
        .select();

      if (emailError) {
        console.error("Error updating admin by email:", emailError.message);
        return;
      }

      if (emailData && emailData.length > 0) {
        console.log("✅ Successfully activated admin account (found by email)");
        console.log("Account details:", emailData[0]);
      } else {
        console.log("❌ Could not find admin account by username or email");
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error.message);
  } finally {
    process.exit(0);
  }
}

activateAdmin();
