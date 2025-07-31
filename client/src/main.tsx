import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { initGlobalErrorHandling } from "./lib/errorHandler";
import "./components/translateSearch.js"; // Import Google Translate search enhancement

// Initialize global error handling to suppress common third-party errors
initGlobalErrorHandling();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
