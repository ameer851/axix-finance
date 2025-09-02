import { createRoot } from "react-dom/client";
import App from "./App";
import "./components/translateSearch.js"; // Import Google Translate search enhancement
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import { initGlobalErrorHandling } from "./lib/errorHandler";

// Initialize global error handling to suppress common third-party errors
initGlobalErrorHandling();

// Make Supabase test functions available globally for debugging
if (import.meta.env.DEV) {
  import("./utils/supabaseTest").then(
    ({ testSupabaseConnection, debugSupabaseConfig }) => {
      (window as any).testSupabaseConnection = testSupabaseConnection;
      (window as any).debugSupabaseConfig = debugSupabaseConfig;
      console.log("🔧 Supabase debug functions available:");
      console.log("- testSupabaseConnection()");
      console.log("- debugSupabaseConfig()");
    }
  );
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
