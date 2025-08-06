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

// Remove all Supabase Auth users except the admin
async function removeAllExceptAdmin() {
  try {
    const adminEmail = "admin@axixfinance.com";
    console.log("Fetching all users from Supabase Auth...");
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error("Error fetching users from Auth:", listError);
      return;
    }
    const adminUser = users.find((u) => u.email === adminEmail);
    if (!adminUser) {
      console.log(`Admin user (${adminEmail}) not found in Supabase Auth.`);
      return;
    }
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      adminUser.id
    );
    if (deleteError) {
      console.error(`Error deleting admin user:`, deleteError);
    } else {
      console.log(`✅ Deleted admin user: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

removeAllExceptAdmin();
