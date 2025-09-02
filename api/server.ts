import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import session from "express-session";
let createServer: any, WebSocketServer: any;
if (!process.env.VERCEL) {
  createServer = require("http").createServer;
  WebSocketServer = require("ws").WebSocketServer;
}

// Log Vercel env for diagnostics
console.log("[server] Starting API server. VERCEL:", process.env.VERCEL);
config();

const app = express();
let server: any = null;
if (!process.env.VERCEL) {
  server = createServer(app);
  // WebSocket server setup (local/dev only)
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws: any) => {
    console.log("New WebSocket connection");
    ws.on("message", (message: any) => {
      console.log("Received:", message);
      ws.send(`Server received: ${message}`);
    });
    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
}

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
        allowedOrigins.includes(origin) ||
        origin.endsWith(".supabase.co") ||
        /https?:\/\/[a-z0-9-]+\.fly\.dev$/i.test(origin);

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

// Session configuration (disable on Vercel)
if (!process.env.VERCEL) {
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
}

// Admin users endpoint consolidated here to avoid extra serverless function
// Place Supabase config BEFORE any routes to avoid TDZ errors in diagnostics
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

// No static serving here; Vercel serves client/dist. This function handles only /api/*.

// API routes

app.get("/api/health", (req, res) => {
  try {
    // Diagnostics for all critical env vars and objects
    const diagnostics: any = {
      NODE_ENV: process.env.NODE_ENV || null,
      VERCEL: process.env.VERCEL || null,
      SUPABASE_URL: process.env.SUPABASE_URL || null,
      SUPABASE_SERVICE_ROLE_KEY_PRESENT:
        !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      SERVICE_ROLE_KEY_PRESENT: !!SERVICE_ROLE_KEY,
      SUPABASE_ADMIN_CONFIGURED: !!supabaseAdmin,
      SESSION_SECRET_PRESENT: !!process.env.SESSION_SECRET,
      PORT: process.env.PORT || null,
      SITE_URL: process.env.SITE_URL || null,
      FRONTEND_URL: process.env.FRONTEND_URL || null,
      CLIENT_URL: process.env.CLIENT_URL || null,
    } as const;
    res.json({ status: "ok", diagnostics });
  } catch (err: any) {
    console.error("[health-error]", err);
    res.status(500).json({
      error: "health endpoint crash",
      details: err && err.message ? err.message : String(err),
    });
  }
});

app.get("/api/ping", (req, res) => {
  try {
    // Diagnostics for all critical env vars and objects
    const diagnostics: any = {
      NODE_ENV: process.env.NODE_ENV || null,
      VERCEL: process.env.VERCEL || null,
      SUPABASE_URL: process.env.SUPABASE_URL || null,
      SUPABASE_SERVICE_ROLE_KEY_PRESENT:
        !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      SERVICE_ROLE_KEY_PRESENT: !!SERVICE_ROLE_KEY,
      SUPABASE_ADMIN_CONFIGURED: !!supabaseAdmin,
      SESSION_SECRET_PRESENT: !!process.env.SESSION_SECRET,
      PORT: process.env.PORT || null,
      SITE_URL: process.env.SITE_URL || null,
      FRONTEND_URL: process.env.FRONTEND_URL || null,
      CLIENT_URL: process.env.CLIENT_URL || null,
    } as const;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || null,
      diagnostics,
    });
  } catch (err: any) {
    console.error("[ping-error]", err);
    res.status(500).json({
      error: "ping endpoint crash",
      details: err && err.message ? err.message : String(err),
    });
  }
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

// Admin user transactions endpoint
app.get("/api/admin/user-transactions", async (req, res) => {
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
    const sortBy = (req.query.sortBy as string) || "balance";
    const sortOrder = (req.query.sortOrder as string) || "desc";
    const search = (req.query.search as string) || "";

    // Build the query
    let query = supabaseAdmin.from("users").select(
      `
        id,
        email,
        username,
        first_name,
        last_name,
        balance,
        bitcoin_address,
        bitcoin_cash_address,
        ethereum_address,
        usdt_trc20_address,
        bnb_address,
        created_at,
        updated_at
      `,
      { count: "exact" }
    );

    // Add search filter if provided
    if (search.trim()) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
    }

    // Add sorting
    const validSortFields = [
      "balance",
      "email",
      "username",
      "created_at",
      "id",
      "first_name",
      "last_name",
    ];
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return res
        .status(500)
        .json({
          error: "Failed to fetch user transactions",
          details: error.message,
        });
    }

    // Calculate transaction stats for each user (simplified version)
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get transaction counts (you may need to adjust based on your actual transaction table)
        const { count: transactionCount } = await supabaseAdmin
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Get total deposits and withdrawals (simplified)
        const { data: deposits } = await supabaseAdmin
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("type", "deposit");

        const { data: withdrawals } = await supabaseAdmin
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("type", "withdrawal");

        const totalDeposits =
          deposits?.reduce(
            (sum, tx) => sum + parseFloat(tx.amount || "0"),
            0
          ) || 0;
        const totalWithdrawals =
          withdrawals?.reduce(
            (sum, tx) => sum + parseFloat(tx.amount || "0"),
            0
          ) || 0;

        // Get last transaction date
        const { data: lastTransaction } = await supabaseAdmin
          .from("transactions")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          balance: user.balance || "0",
          bitcoinAddress: user.bitcoin_address,
          bitcoinCashAddress: user.bitcoin_cash_address,
          ethereumAddress: user.ethereum_address,
          usdtTrc20Address: user.usdt_trc20_address,
          bnbAddress: user.bnb_address,
          totalDeposits,
          totalWithdrawals,
          transactionCount: transactionCount || 0,
          lastTransactionDate: lastTransaction?.created_at,
        };
      })
    );

    return res.status(200).json({
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (e: any) {
    console.error("User transactions endpoint error:", e);
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

const port = process.env.PORT || 8080;
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
