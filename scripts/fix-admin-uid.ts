import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
// Explicit extension to avoid ESM directory import resolution error
import { DatabaseStorage } from "../server/storage.ts";

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceRole) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    process.exit(1);
  }
  const authEmail = process.env.OWNER_EMAIL || "admin@axixfinance.com";
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authUsers, error: authErr } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (authErr) {
    console.error("Failed to list auth users", authErr);
    process.exit(1);
  }
  const match = authUsers.users.find(
    (u) => (u.email || "").toLowerCase() === authEmail.toLowerCase()
  );
  if (!match) {
    console.error("Could not find auth user for email", authEmail);
    process.exit(1);
  }
  const authUid = match.id;
  const storage = new DatabaseStorage();
  // Try by email first
  const userByEmail = await (storage as any).getUserByEmail?.(authEmail);
  if (!userByEmail) {
    console.error("App user not found by email, cannot update uid");
    process.exit(1);
  }
  if (userByEmail.uid === authUid) {
    console.log("Admin user already has correct uid");
    return;
  }
  // Direct update using supabase client to avoid missing method
  const { error: updErr } = await (supabase as any)
    .from("users")
    .update({ uid: authUid })
    .eq("id", userByEmail.id);
  if (updErr) {
    console.error("Failed to update admin user uid", updErr);
    process.exit(1);
  }
  console.log("Updated admin user uid", { id: userByEmail.id, uid: authUid });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
