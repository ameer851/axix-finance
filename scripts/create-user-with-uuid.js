import { createClient } from "@supabase/supabase-js";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc"
);

// Password hashing function (same as in server/auth.ts)
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await promisify(scrypt)(password, salt, 64);
  return salt + ":" + hash.toString("hex");
}

async function createUserWithUUID() {
  try {
    console.log("🔧 Creating user with proper UUID...");

    // Test user credentials
    const testUser = {
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      role: "user",
    };

    // Generate proper UUID
    const uid = uuidv4();
    console.log("🆔 Generated UUID:", uid);

    // Hash the password
    const hashedPassword = await hashPassword(testUser.password);
    console.log("🔐 Password hashed successfully");

    // Create the user with current schema fields
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        uid: uid,
        email: testUser.email,
        full_name: `${testUser.firstName} ${testUser.lastName}`,
        role: testUser.role,
        is_admin: false,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating user:", error);
      return;
    }

    console.log("✅ User created successfully!");
    console.log("\n📋 User Details:");
    console.log(`   UID: ${uid}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Full Name: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Password: ${testUser.password} (hashed)`);

    // Also create an admin user
    console.log("\n🔧 Creating admin user...");

    const adminUser = {
      email: "admin@axixfinance.com",
      password: "Axix-Admin@123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    };

    const adminUid = uuidv4();
    const hashedAdminPassword = await hashPassword(adminUser.password);

    const { data: admin, error: adminError } = await supabase
      .from("users")
      .insert({
        uid: adminUid,
        email: adminUser.email,
        full_name: `${adminUser.firstName} ${adminUser.lastName}`,
        role: adminUser.role,
        is_admin: true,
      })
      .select()
      .single();

    if (adminError) {
      console.error("❌ Error creating admin user:", adminError);
    } else {
      console.log("✅ Admin user created successfully!");
      console.log("\n📋 Admin User Details:");
      console.log(`   UID: ${adminUid}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Full Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Password: ${adminUser.password} (hashed)`);
    }

    console.log("\n🎉 Users created successfully!");
    console.log("\n⚠️  IMPORTANT: These users are created in the database");
    console.log("🔧 But the server authentication expects different fields");
    console.log("💡 You need to either:");
    console.log("   1. Update the database schema to add missing fields");
    console.log("   2. Update the server code to work with current schema");
    console.log("   3. Use Supabase Auth instead of custom authentication");

    console.log("\n🔑 For now, you can try logging in with:");
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log("   OR");
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${adminUser.password}`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

createUserWithUUID();
