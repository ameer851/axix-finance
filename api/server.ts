import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import session from "express-session";
import { createServer } from "http";
import { WebSocketServer } from "ws";

config();

const app = express();
const server = createServer(app);

// WebSocket server setup
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  ws.on("message", (message) => {
    console.log("Received:", message);
    ws.send(`Server received: ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "https://axix-finance.vercel.app",
  "https://axixfinance.com",
  "https://www.axixfinance.com",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.SITE_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) || origin.endsWith(".supabase.co");

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn(`Blocked request from unauthorized origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Info"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
});

app.use(sessionMiddleware);

// No static serving here; Vercel serves client/dist. This function handles only /api/*.

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Minimal visitor tracking endpoints to avoid client retries and ensure JSON responses
app.post("/api/visitors/session", (req, res) => {
  res.json({ success: true });
});

app.delete("/api/visitors/session", (req, res) => {
  res.json({ success: true });
});

app.post("/api/visitors/track", (req, res) => {
  res.json({ success: true });
});

app.put("/api/visitors/activity", (req, res) => {
  res.json({ success: true });
});

// No-op welcome email endpoint to prevent client warnings; integrate real email later
app.post("/api/send-welcome-email", (req, res) => {
  res.json({ success: true });
});

// Admin users endpoint consolidated here to avoid extra serverless function
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

// Create user profile after Supabase auth signup
app.post("/api/auth/create-profile", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      console.error(
        "[create-profile] Supabase admin not configured. Check SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL env vars."
      );
      return res.status(500).json({ error: "Supabase admin not configured" });
    }
    const { uid, email, username, firstName, lastName } = req.body || {};
    if (!uid || !email || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await (supabaseAdmin as any)
      .from("users")
      .insert([
        {
          uid,
          email,
          username,
          first_name: firstName || null,
          last_name: lastName || null,
          full_name: firstName && lastName ? `${firstName} ${lastName}` : null,
          role: "user",
          is_active: true,
          balance: "0",
        },
      ])
      .select()
      .single();

    if (error) {
      const code = (error as any).code;
      if (code === "23505") {
        return res
          .status(409)
          .json({ error: "Username or email already exists" });
      }
      return res
        .status(500)
        .json({ error: error.message || "Failed to create profile" });
    }

    return res.json({ success: true, user: data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase admin not configured" });
    }

    // Optional: simple bearer check if provided
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const offset = (page - 1) * limit;

    const {
      data: users,
      error,
      count,
    } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1);

    if (error) {
      return res
        .status(500)
        .json({ error: "Failed to fetch users", details: error.message });
    }

    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      error: "Internal server error",
      details: e?.message || String(e),
    });
  }
});

// Temporary debug endpoint: returns boolean status about Supabase admin config
// Safe: does not return secrets, only flags indicating presence
app.get("/api/debug/status", (req, res) => {
  try {
    return res.json({
      supabaseAdminConfigured: !!supabaseAdmin,
      supabaseUrlPresent: !!SUPABASE_URL,
      serviceRoleKeyPresent: !!SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV || null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: String(e) });
  }
});

// Ensure unknown /api routes return JSON 404 (not HTML) AFTER all api routes
app.use("/api", (req, res) => {
  return res.status(404).json({
    error: "Not Found",
    message: `No handler for ${req.method} ${req.path}`,
  });
});

// Explicitly respond to GET /api with JSON to prevent SPA HTML fallback
app.get("/api", (req, res) => {
  return res.json({ status: "ok", message: "API root" });
});

// No SPA fallback here; handled by Vercel routing to index.html.

// Error handling middleware
app.use((err: any, req: any, res: any, next: Function) => {
  // Log full error for diagnostics
  try {
    console.error("[server-error]", err && err.stack ? err.stack : err);
  } catch (e) {
    console.error("[server-error] unable to stringify error", e);
  }

  // Return JSON so clients (and our smoke tests) get structured error info
  const message = err && err.message ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
