import { createClient } from "@supabase/supabase-js";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

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

async function createTestUserWithPassword() {
  try {
    console.log(
      "🔧 Creating test user with password for server authentication..."
    );

    // Test user credentials
    const testUser = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      role: "user",
      isActive: true,
      isVerified: true,
      balance: "0",
      twoFactorEnabled: false,
    };

    // Hash the password
    const hashedPassword = await hashPassword(testUser.password);
    console.log("🔐 Password hashed successfully");

    // Create the user with all required fields
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        uid: "test-user-" + Date.now(), // Generate a unique UID
        email: testUser.email,
        username: testUser.username,
        password: hashedPassword,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        full_name: `${testUser.firstName} ${testUser.lastName}`,
        role: testUser.role,
        is_admin: false,
        isActive: testUser.isActive,
        isVerified: testUser.isVerified,
        balance: testUser.balance,
        twoFactorEnabled: testUser.twoFactorEnabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating test user:", error);

      // If it's a schema error, let's try with minimal fields
      if (error.message.includes("column") || error.code === "PGRST204") {
        console.log("🔄 Trying with minimal fields...");

        const { data: minimalUser, error: minimalError } = await supabase
          .from("users")
          .insert({
            uid: "test-user-" + Date.now(),
            email: testUser.email,
            full_name: `${testUser.firstName} ${testUser.lastName}`,
            role: testUser.role,
            is_admin: false,
          })
          .select()
          .single();

        if (minimalError) {
          console.error("❌ Error creating minimal user:", minimalError);
          return;
        } else {
          console.log("✅ Minimal user created successfully!");
          console.log("📋 User created with basic fields only");
          console.log(
            "💡 You'll need to update the database schema to add missing fields"
          );
        }
      }
      return;
    }

    console.log("✅ Test user created successfully!");
    console.log("\n📋 Test User Details:");
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Active: ${testUser.isActive ? "Yes" : "No"}`);
    console.log(`   Verified: ${testUser.isVerified ? "Yes" : "No"}`);

    // Also create an admin user
    console.log("\n🔧 Creating admin user...");

    const adminUser = {
      username: "admin",
      email: "admin@axixfinance.com",
      password: "Axix-Admin@123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
      isVerified: true,
      balance: "0",
      twoFactorEnabled: false,
    };

    const hashedAdminPassword = await hashPassword(adminUser.password);

    const { data: admin, error: adminError } = await supabase
      .from("users")
      .insert({
        uid: "admin-user-" + Date.now(),
        email: adminUser.email,
        username: adminUser.username,
        password: hashedAdminPassword,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        full_name: `${adminUser.firstName} ${adminUser.lastName}`,
        role: adminUser.role,
        is_admin: true,
        isActive: adminUser.isActive,
        isVerified: adminUser.isVerified,
        balance: adminUser.balance,
        twoFactorEnabled: adminUser.twoFactorEnabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (adminError) {
      console.error("❌ Error creating admin user:", adminError);
    } else {
      console.log("✅ Admin user created successfully!");
      console.log("\n📋 Admin User Details:");
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Password: ${adminUser.password}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.isActive ? "Yes" : "No"}`);
      console.log(`   Verified: ${adminUser.isVerified ? "Yes" : "No"}`);
    }

    console.log("\n🎉 Setup complete!");
    console.log("\n🔑 You can now login with:");
    console.log(
      `   Username: ${testUser.username} OR Email: ${testUser.email}`
    );
    console.log(`   Password: ${testUser.password}`);
    console.log("   OR");
    console.log(
      `   Username: ${adminUser.username} OR Email: ${adminUser.email}`
    );
    console.log(`   Password: ${adminUser.password}`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

createTestUserWithPassword();
