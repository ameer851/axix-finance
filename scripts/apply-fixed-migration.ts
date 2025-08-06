import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { supabase } from "../server/supabase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyFixedMigration() {
  try {
    console.log("Starting database migration process with fixed SQL...");

    // Read the fixed migration file
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20250806_fix_user_schema_fixed.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`Fixed migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("Fixed migration file read successfully.");
    console.log(
      "⚠️ IMPORTANT: This script provides a fixed version of the migration that properly handles UUID type casting."
    );
    console.log(
      "To apply this fixed migration, please use one of the following methods:"
    );
    console.log("");
    console.log("1. Supabase Dashboard:");
    console.log(
      "   - Log in to the Supabase dashboard (https://app.supabase.io)"
    );
    console.log("   - Navigate to your project");
    console.log("   - Go to the SQL Editor section");
    console.log("   - Copy and paste the SQL from the FIXED migration file");
    console.log("   - Execute the SQL");
    console.log("");
    console.log("2. Supabase CLI (if installed):");
    console.log(
      "   - Replace the original migration file with this fixed version"
    );
    console.log("   - Run: supabase db push");
    console.log("");
    console.log("3. Direct Database Connection:");
    console.log(
      "   - If you have direct PostgreSQL access, connect using psql or another PostgreSQL client"
    );
    console.log("   - Execute the SQL statements in the fixed migration file");
    console.log("");
    console.log("Here is the FIXED SQL that needs to be executed:");
    console.log("-------------------------------------------");
    console.log(migrationSQL);
    console.log("-------------------------------------------");

    // For demo purposes, let's verify we can at least connect to the database
    try {
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) {
        console.error("Error connecting to database:", error);
      } else {
        console.log(
          "Successfully connected to database. User count result:",
          data
        );
      }
    } catch (connError) {
      console.error("Failed to connect to database:", connError);
    }

    console.log(
      "Fixed migration script completed. Please apply the SQL manually as described above."
    );
    process.exit(0);
  } catch (err) {
    console.error("Error running fixed migration script:", err);
    process.exit(1);
  }
}

applyFixedMigration();
