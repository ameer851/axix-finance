import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAdmin() {
  try {
    console.log("\nChecking users table for admin profile...");
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@axixfinance.com")
      .single();

    console.log("Profile check result:", profileError ? "Failed" : "Success");
    if (profileError) {
      console.error("Profile error:", profileError);
    } else {
      console.log("Admin profile:", profileData);
    }

    if (!profileData?.uid) {
      console.log("\nNo admin profile found, checking all users:");
      const { data: allUsers, error: allUsersError } = await supabase
        .from("users")
        .select("*");

      if (allUsersError) {
        console.error("Error fetching users:", allUsersError);
      } else {
        console.log("All users:", allUsers);
      }
    } else {
      console.log("\nChecking auth user by ID:", profileData.uid);
      const { data: authUser, error: authError } =
        await supabase.auth.admin.getUserById(profileData.uid);

      console.log("Auth check result:", authError ? "Failed" : "Success");
      if (authError) {
        console.error("Auth error:", authError);
      } else {
        console.log("Auth user found:", authUser);
      }
    }
  } catch (error) {
    console.error("Error checking admin:", error);
  }
}

checkAdmin();
