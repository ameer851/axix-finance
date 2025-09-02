import { supabase } from "@/lib/supabase";

/**
 * Test Supabase connection and configuration
 */
export async function testSupabaseConnection() {
  console.log("🔍 Testing Supabase Connection...");

  try {
    // Test 1: Basic connection
    console.log("1. Testing basic Supabase client creation...");
    if (!supabase) {
      throw new Error("Supabase client is not initialized");
    }
    console.log("✅ Supabase client created successfully");

    // Test 2: Check if we can reach the Supabase endpoint
    console.log("2. Testing Supabase endpoint reachability...");
    try {
      const response = await fetch(
        "https://oyqanlnqfyyaqheehsmw.supabase.co/rest/v1/",
        {
          method: "HEAD",
          headers: {
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc",
          },
        }
      );

      if (!response.ok) {
        console.warn(
          "⚠️ Supabase endpoint returned:",
          response.status,
          response.statusText
        );
        if (response.status === 404) {
          console.error(
            "❌ Supabase project not found! The project ID might be incorrect."
          );
          return {
            success: false,
            message:
              "Supabase project not found. Please check the project URL and API key.",
            error: new Error("Project not found"),
          };
        }
      } else {
        console.log("✅ Supabase endpoint is reachable");
      }
    } catch (fetchError: any) {
      if (
        fetchError.name === "TypeError" &&
        fetchError.message.includes("CORS")
      ) {
        console.error(
          "❌ CORS Error: The domain is not allowed in Supabase CORS settings"
        );
        console.log("🔧 To fix this:");
        console.log(
          "1. Go to https://supabase.com/dashboard/project/oyqanlnqfyyaqheehsmw/settings/api"
        );
        console.log("2. Add 'https://axixfinance.com' to 'Site URL'");
        console.log("3. Add 'https://axixfinance.com' to 'Redirect URLs'");
        return {
          success: false,
          message: "CORS error: Domain not allowed in Supabase settings",
          error: fetchError,
        };
      }
      console.error("❌ Network error:", fetchError);
      throw fetchError;
    }

    // Test 3: Try to get current session (this might fail if not logged in)
    console.log("3. Testing session retrieval...");
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.log(
        "ℹ️ Session error (expected if not logged in):",
        sessionError.message
      );
    } else {
      console.log("✅ Session retrieved successfully");
    }

    // Test 4: Try a simple query to test database connection
    console.log("4. Testing database connection...");
    try {
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) {
        console.log(
          "ℹ️ Database query error (expected with RLS):",
          error.message
        );
      } else {
        console.log("✅ Database connection successful");
      }
    } catch (dbError) {
      console.log("ℹ️ Database connection test failed:", dbError);
    }

    console.log("🎉 Supabase connection test completed!");
    return { success: true, message: "Connection test completed" };
  } catch (error: any) {
    console.error("❌ Supabase connection test failed:", error);
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
}

/**
 * Debug Supabase configuration
 */
export function debugSupabaseConfig() {
  console.log("🔧 Supabase Configuration Debug:");
  console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log(
    "API Key (first 20 chars):",
    import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + "..."
  );
  console.log("Mode:", import.meta.env.MODE);
  console.log("Dev:", import.meta.env.DEV);
  console.log(
    "Full URL being used:",
    "https://oyqanlnqfyyaqheehsmw.supabase.co"
  );
  console.log("Project ID:", "oyqanlnqfyyaqheehsmw");
}
