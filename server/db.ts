import { testSupabaseConnection } from "./supabase";

// Environment variables should be provided by the runtime (Fly secrets)

// Set up global database connection issues flag
declare global {
  var dbConnectionIssues: boolean;
}

// Add health check function to test database connection
export async function checkDatabaseConnection() {
  console.log("🔄 Using Supabase for database operations");
  try {
    const supabaseConnected = await testSupabaseConnection();
    if (supabaseConnected) {
      console.log("✅ Supabase connection successful");
      global.dbConnectionIssues = false;
      return true;
    } else {
      console.log(
        "❌ Supabase connection failed - continuing with limited functionality"
      );
      global.dbConnectionIssues = true;
      return false;
    }
  } catch (error) {
    console.log(
      "❌ Supabase connection error - continuing with limited functionality"
    );
    console.log("Error details:", error);
    global.dbConnectionIssues = true;
    return false;
  }
}

// Create dummy exports for compatibility
export const pool = null;
export const db = null;
