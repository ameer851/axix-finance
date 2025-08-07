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
    console.log("🔧 Creating test user...");

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

    // Create the user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        username: testUser.username,
        email: testUser.email,
        password: hashedPassword,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
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

    console.log("\n🔑 You can now login with:");
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Password: ${testUser.password}`);

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
        username: adminUser.username,
        email: adminUser.email,
        password: hashedAdminPassword,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
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
      console.log("\n🔑 Admin login credentials:");
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Password: ${adminUser.password}`);
    }

    console.log("\n🎉 Setup complete! You can now test login functionality.");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

createTestUser();
