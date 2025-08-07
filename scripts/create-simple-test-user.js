import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc"
);

async function createSimpleTestUser() {
  try {
    console.log("🔧 Creating simple test user with Supabase Auth...");

    // Test user credentials
    const testUser = {
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
    };

    console.log("📝 Creating auth user...");

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          role: "user",
        },
      },
    });

    if (authError) {
      console.error("❌ Error creating auth user:", authError);
      return;
    }

    if (!authData.user?.id) {
      console.error("❌ No user ID returned from auth creation");
      return;
    }

    console.log("✅ Auth user created with ID:", authData.user.id);

    // Now create the user profile in the database
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .insert({
        uid: authData.user.id,
        email: testUser.email,
        full_name: `${testUser.firstName} ${testUser.lastName}`,
        role: "user",
        is_admin: false,
      })
      .select()
      .single();

    if (profileError) {
      console.error("❌ Error creating user profile:", profileError);
      return;
    }

    console.log("✅ User profile created successfully!");
    console.log("\n📋 Test User Details:");
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Full Name: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Role: user`);
    console.log(`   Auth ID: ${authData.user.id}`);

    // Create admin user
    console.log("\n🔧 Creating admin user...");

    const adminUser = {
      email: "admin@axixfinance.com",
      password: "Axix-Admin@123",
      firstName: "Admin",
      lastName: "User",
    };

    const { data: adminAuthData, error: adminAuthError } =
      await supabase.auth.signUp({
        email: adminUser.email,
        password: adminUser.password,
        options: {
          data: {
            first_name: adminUser.firstName,
            last_name: adminUser.lastName,
            role: "admin",
          },
        },
      });

    if (adminAuthError) {
      console.error("❌ Error creating admin auth user:", adminAuthError);
    } else if (adminAuthData.user?.id) {
      console.log("✅ Admin auth user created with ID:", adminAuthData.user.id);

      // Create admin profile
      const { data: adminProfileData, error: adminProfileError } =
        await supabase
          .from("users")
          .insert({
            uid: adminAuthData.user.id,
            email: adminUser.email,
            full_name: `${adminUser.firstName} ${adminUser.lastName}`,
            role: "admin",
            is_admin: true,
          })
          .select()
          .single();

      if (adminProfileError) {
        console.error("❌ Error creating admin profile:", adminProfileError);
      } else {
        console.log("✅ Admin profile created successfully!");
        console.log("\n📋 Admin User Details:");
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Password: ${adminUser.password}`);
        console.log(
          `   Full Name: ${adminUser.firstName} ${adminUser.lastName}`
        );
        console.log(`   Role: admin`);
        console.log(`   Auth ID: ${adminAuthData.user.id}`);
      }
    }

    console.log("\n🎉 Users created successfully!");
    console.log("\n🔑 You can now login with:");
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log("   OR");
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${adminUser.password}`);

    console.log("\n💡 The login system has been updated to use Supabase Auth!");
    console.log(
      "🔧 This should resolve the 'Invalid username or password' error."
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

createSimpleTestUser();
