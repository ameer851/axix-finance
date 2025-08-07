import { createClient } from "@supabase/supabase-js";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc"
);

// Password hashing function (same as in server/auth.ts)
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await promisify(scrypt)(password, salt, 64);
  return salt + ":" + hash.toString("hex");
}

async function createTestUser() {
  try {
    console.log("🔧 Creating test user with correct schema...");

    // Test user credentials - matching the actual schema
    const testUser = {
      uid: "test-user-123", // Required field
      email: "test@example.com",
      full_name: "Test User",
      role: "user",
      is_admin: false,
    };

    // Create the user with only the fields that exist in the schema
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        uid: testUser.uid,
        email: testUser.email,
        full_name: testUser.full_name,
        role: testUser.role,
        is_admin: testUser.is_admin,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating test user:", error);
      return;
    }

    console.log("✅ Test user created successfully!");
    console.log("\n📋 Test User Details:");
    console.log(`   UID: ${testUser.uid}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Full Name: ${testUser.full_name}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Admin: ${testUser.is_admin ? "Yes" : "No"}`);

    // Also create an admin user
    console.log("\n🔧 Creating admin user...");

    const adminUser = {
      uid: "admin-user-123",
      email: "admin@axixfinance.com",
      full_name: "Admin User",
      role: "admin",
      is_admin: true,
    };

    const { data: admin, error: adminError } = await supabase
      .from("users")
      .insert({
        uid: adminUser.uid,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
        is_admin: adminUser.is_admin,
      })
      .select()
      .single();

    if (adminError) {
      console.error("❌ Error creating admin user:", adminError);
    } else {
      console.log("✅ Admin user created successfully!");
      console.log("\n📋 Admin User Details:");
      console.log(`   UID: ${adminUser.uid}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Full Name: ${adminUser.full_name}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Admin: ${adminUser.is_admin ? "Yes" : "No"}`);
    }

    console.log(
      "\n⚠️  IMPORTANT: The database schema is different from what the server expects!"
    );
    console.log(
      "🔧 The server code expects fields like 'username', 'password', 'isActive', etc."
    );
    console.log(
      "📋 But the actual database only has: uid, email, full_name, role, is_admin"
    );
    console.log("💡 You need to either:");
    console.log(
      "   1. Update the database schema to match the server expectations"
    );
    console.log("   2. Update the server code to work with the current schema");
    console.log("   3. Use Supabase Auth instead of custom authentication");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

createTestUser();
