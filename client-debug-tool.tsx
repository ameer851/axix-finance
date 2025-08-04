// Add this at the top of your client/src/main.tsx or App.tsx file
// This will log the Supabase environment variables in the browser console

// Debug Supabase configuration
if (import.meta.env.DEV || import.meta.env.MODE === "development") {
  console.log("Supabase Configuration:");
  console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log(
    "VITE_SUPABASE_ANON_KEY (first 10 chars):",
    import.meta.env.VITE_SUPABASE_ANON_KEY
      ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + "..."
      : "undefined"
  );
  console.log("VITE_FRONTEND_URL:", import.meta.env.VITE_FRONTEND_URL);
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
}
