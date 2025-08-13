import { createClient } from "@supabase/supabase-js";

// Supabase configuration for API serverless functions
const supabaseUrl =
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

// Create Supabase client only if properly configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: fetch,
        headers: { "x-application-name": "axix-finance-api" },
      },
      db: {
        schema: "public",
      },
    })
  : null;

console.log("[supabase.ts] Configuration check:", {
  urlPresent: !!supabaseUrl,
  keyPresent: !!supabaseServiceKey,
  isConfigured: isSupabaseConfigured,
});
