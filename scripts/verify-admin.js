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
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function inspectTable() {
  try {
    // First, let's see what columns exist in the users table
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      console.error("Error inspecting table:", error);
      return;
    }

    if (data && data.length > 0) {
      console.log("Available columns in users table:");
      console.log(Object.keys(data[0]));
    } else {
      console.log("Table is empty. Running DESCRIBE query...");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

async function createAdmin() {
  try {
    console.log("Checking for existing admin user...");

    // Try to sign in with admin credentials first
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: "admin@axixfinance.com",
        password: "Axix-Admin@123",
      });

    if (!signInError) {
      console.log("Admin user exists and credentials are valid!");
      console.log("You can login with:");
      console.log("Email: admin@axixfinance.com");
      console.log("Password: Axix-Admin@123");
      return;
    }

    // If sign in failed, try to create the user
    console.log("Creating new admin user...");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: "admin@axixfinance.com",
      password: "Axix-Admin@123",
      options: {
        data: {
          username: "admin",
          name: "Admin User",
          role: "admin",
          is_verified: true,
          is_active: true,
        },
      },
    });

    if (authError) {
      console.error("Error creating admin user:", authError);
      return;
    }

    // Now update the user's role in the database
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("email", "admin@axixfinance.com");

    if (updateError) {
      console.error("Error updating admin role:", updateError);
      return;
    }

    console.log("Admin user created successfully!");
    console.log("Login credentials:");
    console.log("Email: admin@axixfinance.com");
    console.log("Password: Axix-Admin@123");

    // Instructions for first login
    console.log(
      "\nIMPORTANT: On first login, you may need to verify your email."
    );
    console.log("Check your email for a verification link from Supabase.");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

createAdmin();
