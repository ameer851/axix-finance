import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key for admin access
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  throw new Error("Supabase service role key is required");
}

if (!SUPABASE_URL) {
  console.error("Missing SUPABASE_URL environment variable");
  throw new Error("Supabase URL is required");
}

export const supabase = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY, // This should be set in Vercel environment variables
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
