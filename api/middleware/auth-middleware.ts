import { NextFunction, Request, Response } from "express";
import { supabase } from "../supabase";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  isVerified?: boolean;
}

// Custom interface for authenticated request with proper type safety
interface RequestWithAuth extends Request {
  authUser?: AuthUser;
}

// Auth middleware factory
export const createAuthMiddleware = (
  options: { requireAdmin?: boolean } = {}
) => {
  return async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const token = authHeader.substring(7);

      // Verify token with Supabase
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Get user from our database
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (dbError || !dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check admin requirement if specified
      if (options.requireAdmin && dbUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Attach verified user info to request
      req.authUser = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        isVerified: dbUser.is_verified,
      };

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

// Middleware instances
export const requireAuth = createAuthMiddleware();
export const requireAdmin = createAuthMiddleware({ requireAdmin: true });
