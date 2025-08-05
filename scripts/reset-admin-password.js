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

async function resetAdminPassword() {
  try {
    console.log("Sending password reset email to admin...");

    const { data, error } = await supabase.auth.resetPasswordForEmail(
      "admin@axixfinance.com",
      {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      }
    );

    if (error) {
      console.error("Error sending reset email:", error);
      return;
    }

    console.log("Password reset email sent successfully!");
    console.log("Please check admin@axixfinance.com for the reset link.");
    console.log("After resetting, you can use these credentials:");
    console.log("Email: admin@axixfinance.com");
    console.log("Password: Axix-Admin@123");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

resetAdminPassword();
