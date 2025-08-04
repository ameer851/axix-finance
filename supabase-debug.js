// Debug script to add to client/src/lib/supabase.ts
// Add this at the top of the file to debug the API keys being used

console.log("Supabase Configuration:");
console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
// Only log the first 10 characters of the API key for security
console.log(
  "ANON KEY (first 10 chars):",
  import.meta.env.VITE_SUPABASE_ANON_KEY
    ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + "..."
    : "undefined"
);
