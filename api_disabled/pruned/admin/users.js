"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/admin/users.ts
var users_exports = {};
__export(users_exports, {
  default: () => handler
});
module.exports = __toCommonJS(users_exports);

// api/lib/middleware/cors.ts
function corsMiddleware(req, res, next) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (next) {
    next();
  }
}

// api/lib/supabase-admin.ts
var import_supabase_js = require("@supabase/supabase-js");
var SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
var SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  throw new Error("Supabase service role key is required");
}
if (!SUPABASE_URL) {
  console.error("Missing SUPABASE_URL environment variable");
  throw new Error("Supabase URL is required");
}
var supabase = (0, import_supabase_js.createClient)(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  // This should be set in Vercel environment variables
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// api/admin/users.ts
async function handler(req, res) {
  try {
    corsMiddleware(req, res);
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }
    const token = authHeader.substring(7);
    const { data: user, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || !user.user?.user_metadata?.isAdmin) {
      console.error("Admin authentication failed:", authError);
      return res.status(403).json({ error: "Not authorized as admin" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const {
      data: users,
      error,
      count
    } = await supabase.from("users").select("*", { count: "exact" }).range(offset, offset + limit - 1);
    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        error: "Failed to fetch users",
        details: error.message
      });
    }
    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const {
      data: users,
      error,
      count
    } = await supabase.from("users").select("*", { count: "exact" }).range(offset, offset + limit - 1);
    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        error: "Failed to fetch users",
        details: error.message
      });
    }
    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
