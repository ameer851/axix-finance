import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAdminPassword() {
  const adminEmail = "admin@axixfinance.com";
  const newPassword = "Axix-Admin@!1239";
  try {
    // Find the admin user
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    const adminUser = users.find((u) => u.email === adminEmail);
    if (!adminUser) {
      console.error("Admin user not found in Supabase Auth.");
      return;
    }
    // Reset password
    const { error } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: newPassword,
    });
    if (error) {
      console.error("Error resetting password:", error);
    } else {
      console.log("✅ Admin password reset successfully!");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

resetAdminPassword();
