#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key.startsWith("--")) {
      const name = key.slice(2);
      if (next && !next.startsWith("--")) {
        args[name] = next;
        i++;
      } else {
        args[name] = true;
      }
    }
  }
  return args;
}

(async function main() {
  const args = parseArgs(process.argv);
  const limit = args.limit ? Number(args.limit) : 20;
  const emailLike = args.search || args.email;

  let query = supabase
    .from("users")
    .select("id, uid, email, full_name, username")
    .limit(limit);
  if (emailLike) {
    query = query.ilike("email", `%${emailLike}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to list users:", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No users found.");
    process.exit(0);
  }

  console.log("Users:");
  for (const u of data) {
    console.log(
      `- id=${u.id} uid=${u.uid} email=${u.email} name=${u.full_name || ""} username=${u.username || ""}`
    );
  }
})();
