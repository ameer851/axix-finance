import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsMiddleware } from "../lib/middleware/cors";
import { supabase } from "../lib/supabase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Apply CORS middleware first
    corsMiddleware(req, res);

    // Check for admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const token = authHeader.substring(7);
    // Verify admin token
    const { data: user, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || !user.user?.user_metadata?.isAdmin) {
      console.error("Admin authentication failed:", authError);
      return res.status(403).json({ error: "Not authorized as admin" });
    }

    // Continue with fetching users only if admin authentication succeeds
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Fetch users from Supabase
    const {
      data: users,
      error,
      count,
    } = await supabase
      .from("users")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        error: "Failed to fetch users",
        details: error.message,
      });
    }

    // Return users with pagination info
    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Fetch users from Supabase
    const {
      data: users,
      error,
      count,
    } = await supabase
      .from("users")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        error: "Failed to fetch users",
        details: error.message,
      });
    }

    // Return users with pagination info
    return res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
