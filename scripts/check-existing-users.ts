import { supabase } from "../server/supabase";

async function checkUsers() {
  try {
    console.log("Checking existing users...");

    // Check auth users
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers();
    if (authError) {
      console.error("Error checking auth users:", authError);
    } else {
      console.log(
        "Auth users:",
        authData.users.map((u) => ({ id: u.id, email: u.email }))
      );
    }

    // Check profile users
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("*");

    if (profileError) {
      console.error("Error checking profile users:", profileError);
    } else {
      console.log("Profile users:", profileData);
    }
  } catch (error) {
    console.error("Error checking users:", error);
  }
}

checkUsers();
