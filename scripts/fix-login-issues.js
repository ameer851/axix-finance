import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co",
  process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc"
);

async function fixLoginIssues() {
  console.log("🔍 Investigating login issues...\n");

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), 10000)
    );

    // 1. Check admin account status
    console.log("1. Checking admin account status...");
    const adminPromise = supabase
      .from("users")
      .select("*")
      .eq("username", "admin")
      .single();

    const { data: adminUser, error: adminError } = await Promise.race([
      adminPromise,
      timeoutPromise,
    ]);

    if (adminError) {
      if (adminError.code === "PGRST116") {
        console.log("❌ Admin user not found in database");
        console.log(
          '✅ This explains why login shows "invalid username or password"'
        );
        console.log("💡 Create admin user with the setup script\n");
      } else {
        console.error("❌ Error checking admin user:", adminError.message);
      }
    } else {
      console.log("✅ Admin user found:", {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        isActive: adminUser.isActive,
        isVerified: adminUser.isVerified,
        role: adminUser.role,
      });

      if (!adminUser.isActive) {
        console.log("🔧 Admin account is inactive, this is the issue!");
        console.log("💡 Run the admin activation script to fix this");
      } else {
        console.log("✅ Admin account is active - issue might be elsewhere");
      }
    }

    // 2. List first few users to see current state
    console.log("\n2. Current users in database:");
    const { data: allUsers, error: usersError } = await Promise.race([
      supabase
        .from("users")
        .select("id, username, email, isActive, isVerified, role")
        .order("id")
        .limit(5),
      timeoutPromise,
    ]);

    if (usersError) {
      console.error("❌ Error fetching users:", usersError.message);
    } else {
      console.table(allUsers);
    }

    console.log("\n✅ Login issue investigation complete!");
    console.log("\n🔧 Potential fixes:");
    console.log("1. Clear browser localStorage and cookies");
    console.log("2. If admin not found, run: npm run create-admin");
    console.log("3. If admin inactive, run admin activation script");
    console.log("4. Restart server to clear sessions");
  } catch (error) {
    if (error.message === "Operation timed out") {
      console.error("❌ Connection timed out - check database connection");
    } else {
      console.error("❌ Error during investigation:", error.message);
    }
  } finally {
    process.exit(0);
  }
}

// Run the investigation
fixLoginIssues();
