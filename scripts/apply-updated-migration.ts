import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { supabase } from "../server/supabase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyUpdatedMigration() {
  try {
    console.log(
      "Starting database migration process with updated SQL (username column fix)..."
    );

    // Read the updated migration file
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20250806_fix_user_schema_updated.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`Updated migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Updated migration file read successfully.");
    console.log(
      "⚠️ IMPORTANT: This script provides an updated version of the migration that:"
    );
    console.log("1. Properly handles UUID type casting");
    console.log(
      "2. Checks for and adds the username column if it doesn't exist"
    );
    console.log(
      "3. Drops and recreates policies to ensure they're properly updated"
    );
    console.log("");
    console.log(
      "To apply this updated migration, please use one of the following methods:"
    );
    console.log("");
    console.log("1. Supabase Dashboard:");
    console.log(
      "   - Log in to the Supabase dashboard (https://app.supabase.io)"
    );
    console.log("   - Navigate to your project");
    console.log("   - Go to the SQL Editor section");
    console.log("   - Copy and paste the SQL from the UPDATED migration file");
    console.log("   - Execute the SQL");
    console.log("");
    console.log("2. Supabase CLI (if installed):");
    console.log(
      "   - Replace the original migration file with this updated version"
    );
    console.log("   - Run: supabase db push");
    console.log("");
    console.log("3. Direct Database Connection:");
    console.log(
      "   - If you have direct PostgreSQL access, connect using psql or another PostgreSQL client"
    );
    console.log(
      "   - Execute the SQL statements in the updated migration file"
    );
    console.log("");
    console.log("Here is the UPDATED SQL that needs to be executed:");
    console.log("-------------------------------------------");
    console.log(migrationSQL);
    console.log("-------------------------------------------");

    // For demo purposes, let's verify we can at least connect to the database
    try {
      // First try to get the column names from the users table
      const { data: columnsData, error: columnsError } = await supabase
        .rpc("get_table_columns", { table_name: "users" })
        .select();

      if (columnsError) {
        console.error("Error getting table columns:", columnsError);
        console.log("Trying basic connection test instead...");

        // Fall back to basic connection test
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .limit(1);

        if (error) {
          console.error("Error connecting to database:", error);
        } else {
          console.log("Successfully connected to database.");
        }
      } else {
        console.log("Table columns in 'users' table:", columnsData);
      }
    } catch (connError) {
      console.error("Failed to connect to database:", connError);
    }

    console.log(
      "Updated migration script completed. Please apply the SQL manually as described above."
    );
    process.exit(0);
  } catch (err) {
    console.error("Error running updated migration script:", err);
    process.exit(1);
  }
}

applyUpdatedMigration();
