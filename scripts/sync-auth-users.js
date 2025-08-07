import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc"
);

async function syncAuthUsers() {
  try {
    console.log("🔧 Syncing existing Supabase Auth users to database...");

    // Test user that we know exists in Auth
    const testUser = {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "user",
    };

    // First, let's try to sign in to get the user ID
    console.log("🔍 Getting user ID for:", testUser.email);

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: "password123",
      });

    if (signInError) {
      console.error("❌ Error signing in:", signInError);
      console.log("💡 The user might not exist or password is wrong");
      return;
    }

    if (!signInData.user?.id) {
      console.error("❌ No user ID returned from sign in");
      return;
    }

    console.log("✅ Got user ID:", signInData.user.id);

    // Now create the user profile in the database
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .insert({
        uid: signInData.user.id,
        email: testUser.email,
        full_name: `${testUser.firstName} ${testUser.lastName}`,
        role: testUser.role,
        is_admin: false,
      })
      .select()
      .single();

    if (profileError) {
      if (profileError.code === "23505") {
        console.log("✅ User already exists in database");
      } else {
        console.error("❌ Error creating user profile:", profileError);
        return;
      }
    } else {
      console.log("✅ User profile created successfully!");
    }

    // Try admin user
    console.log("\n🔧 Checking admin user...");

    const adminUser = {
      email: "admin@axixfinance.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    };

    const { data: adminSignInData, error: adminSignInError } =
      await supabase.auth.signInWithPassword({
        email: adminUser.email,
        password: "Axix-Admin@123",
      });

    if (adminSignInError) {
      console.error("❌ Error signing in admin:", adminSignInError);
    } else if (adminSignInData.user?.id) {
      console.log("✅ Got admin user ID:", adminSignInData.user.id);

      // Create admin profile
      const { data: adminProfileData, error: adminProfileError } =
        await supabase
          .from("users")
          .insert({
            uid: adminSignInData.user.id,
            email: adminUser.email,
            full_name: `${adminUser.firstName} ${adminUser.lastName}`,
            role: adminUser.role,
            is_admin: true,
          })
          .select()
          .single();

      if (adminProfileError) {
        if (adminProfileError.code === "23505") {
          console.log("✅ Admin user already exists in database");
        } else {
          console.error("❌ Error creating admin profile:", adminProfileError);
        }
      } else {
        console.log("✅ Admin profile created successfully!");
      }
    }

    console.log("\n🎉 User sync completed!");
    console.log("\n🔑 You can now try logging in with:");
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: password123`);
    console.log("   OR");
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: Axix-Admin@123`);

    console.log("\n💡 The login system has been updated to use Supabase Auth!");
    console.log(
      "🔧 This should resolve the 'Invalid username or password' error."
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

syncAuthUsers();
