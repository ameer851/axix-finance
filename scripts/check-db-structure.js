import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc"
);

async function checkDatabaseStructure() {
  try {
    console.log("🔍 Checking database structure...");

    // Try to get table information
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (tablesError) {
      console.error("❌ Error getting tables:", tablesError);
    } else {
      console.log(
        "📋 Available tables:",
        tables?.map((t) => t.table_name)
      );
    }

    // Check users table structure
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")
      .eq("table_name", "users")
      .order("ordinal_position");

    if (columnsError) {
      console.error("❌ Error getting columns:", columnsError);
    } else {
      console.log("\n📋 Users table structure:");
      console.log("-------------------------------------------------");
      console.log("| Column | Type | Nullable | Default |");
      console.log("-------------------------------------------------");
      columns?.forEach((col) => {
        console.log(
          `| ${col.column_name.padEnd(15)} | ${col.data_type.padEnd(15)} | ${col.is_nullable.padEnd(8)} | ${(col.column_default || "NULL").padEnd(15)} |`
        );
      });
      console.log("-------------------------------------------------");
    }

    // Try to insert a minimal record to see what works
    console.log("\n🧪 Testing minimal insert...");

    const testData = {
      email: "test@example.com",
      role: "user",
    };

    const { data: testInsert, error: testError } = await supabase
      .from("users")
      .insert(testData)
      .select()
      .single();

    if (testError) {
      console.error("❌ Test insert failed:", testError);
      console.log("💡 This shows what fields are required/missing");
    } else {
      console.log("✅ Test insert successful:", testInsert);

      // Clean up the test record
      await supabase.from("users").delete().eq("email", "test@example.com");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkDatabaseStructure();
