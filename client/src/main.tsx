import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { initGlobalErrorHandling } from "./lib/errorHandler";
import { setupDevelopmentConsoleFilters } from "./lib/consoleFilter";
import "./components/translateSearch.js"; // Import Google Translate search enhancement

// Initialize global error handling to suppress common third-party errors
initGlobalErrorHandling();

// Setup development-specific console filtering
setupDevelopmentConsoleFilters();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
