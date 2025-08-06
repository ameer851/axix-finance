import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://oyqanlnqfyyaqheehsmw.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function activateAdminUser() {
  try {
    // Update all admin users to be active and verified
    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: true,
        is_verified: true,
      })
      .eq("role", "admin")
      .select();

    if (error) {
      console.error("Error activating admin users:", error);
      return { success: false, error };
    }

    console.log("Admin users activated:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error activating admin users:", err);
    return { success: false, error: err };
  }
}

// Function to check and fix admin accounts
export async function checkAdminAccounts() {
  try {
    // Get all admin users
    const { data: admins, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("role", "admin");

    if (fetchError) {
      console.error("Error fetching admin accounts:", fetchError);
      return { success: false, error: fetchError };
    }

    console.log(`Found ${admins?.length || 0} admin accounts`);

    // If no admins exist, create a default one
    if (!admins || admins.length === 0) {
      const { data: newAdmin, error: createError } = await supabase
        .from("users")
        .insert({
          email: "admin@axixfinance.com",
          username: "admin",
          first_name: "Admin",
          last_name: "User",
          role: "admin",
          is_admin: true,
          is_active: true,
          is_verified: true,
          balance: "0",
        })
        .select();

      if (createError) {
        console.error("Error creating admin account:", createError);
        return { success: false, error: createError };
      }

      return {
        success: true,
        created: true,
        message: "Admin account created successfully",
      };
    }

    // Otherwise, update all admin accounts
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: true,
        is_verified: true,
      })
      .eq("role", "admin");

    if (updateError) {
      console.error("Error updating admin accounts:", updateError);
      return { success: false, error: updateError };
    }

    return {
      success: true,
      updated: true,
      count: admins.length,
      message: `${admins.length} admin accounts activated`,
    };
  } catch (err) {
    console.error("Unexpected error checking admin accounts:", err);
    return { success: false, error: err };
  }
}
