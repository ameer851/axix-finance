// Modified supabase.ts file to use hardcoded values if environment variables fail
// Replace your client/src/lib/supabase.ts with this file

import { createClient } from "@supabase/supabase-js";

// Try to get config from window object (injected via public/supabase-config.js)
// @ts-ignore
const windowConfig =
  typeof window !== "undefined" ? window.SUPABASE_CONFIG : null;

// Fallback to environment variables
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If environment variables are not available, use hardcoded values
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables missing, using fallback values");

  // Use window config if available
  if (windowConfig) {
    supabaseUrl = windowConfig.supabaseUrl;
    supabaseAnonKey = windowConfig.supabaseAnonKey;
    console.log("Using window config for Supabase");
  } else {
    // Hardcoded fallback values
    supabaseUrl = "https://wvnyiinrmfysabsfztii.supabase.co";
    supabaseAnonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k";
    console.log("Using hardcoded fallback values for Supabase");
  }
}

// Log the configuration that will be used
console.log("Supabase Configuration:");
console.log("URL:", supabaseUrl);
console.log(
  "ANON KEY (first 10 chars):",
  supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + "..." : "undefined"
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
