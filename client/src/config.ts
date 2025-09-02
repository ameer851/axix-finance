// Application configuration
// Defensive resolver for API base to avoid malformed env values (e.g., pasted CLI commands)
function resolveApiUrl(): string {
  const envAny = (import.meta.env as any) ?? {};
  const raw = envAny?.VITE_API_URL as string | undefined;
  const s = String(raw ?? "").trim();
  const allowCross = String(
    envAny?.VITE_ALLOW_CROSS_ORIGIN ?? ""
  ).toLowerCase();
  if (!s) return "/api";

  // Reject obvious bad inputs: spaces, semicolons, or encoded spaces that indicate pasted commands
  if (/[\s;]|%20/i.test(s)) {
    console.warn("Invalid VITE_API_URL detected, falling back to /api", s);
    return "/api";
  }

  // Allow relative API mount points (e.g., "/api")
  if (s.startsWith("/")) return s;

  // Allow absolute origins only (no path) when explicitly allowed
  if (/^https?:\/\/[^\/]+\/?$/i.test(s)) {
    const enabled = allowCross === "1" || allowCross === "true";
    if (enabled) return s.replace(/\/$/, "");
    console.warn(
      "VITE_API_URL is absolute but cross-origin is disabled; using /api",
      s
    );
    return "/api";
  }

  console.warn("Unrecognized VITE_API_URL format, falling back to /api", s);
  return "/api";
}

const config = {
  // API base URL - Prefer same-origin /api in prod to avoid cross-origin HTML/SSO gates
  // Override with VITE_API_URL only if explicitly provided and valid
  apiUrl: resolveApiUrl(),

  // Frontend URL - environment dependent
  frontendUrl:
    import.meta.env.VITE_FRONTEND_URL ||
    (import.meta.env.DEV
      ? "http://localhost:5173"
      : "https://axix-finance.vercel.app"),

  // Supabase configuration
  supabase: {
    url:
      import.meta.env.VITE_SUPABASE_URL ||
      "https://oyqanlnqfyyaqheehsmw.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key",
  },

  // Health check endpoint
  healthCheckEndpoint: "/health",

  // Other configuration settings
  appName: "Axix Finance",
  version: "1.0.0",

  // For development debugging
  debug: import.meta.env.DEV,
};

// Config loaded

export default config;
