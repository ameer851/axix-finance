import { NextFunction, Request, Response } from "express";
import { supabase } from "../supabase";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  isVerified?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  isAuthenticated?: boolean;
}

export function auth(requireAdmin: boolean = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.substring(7);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: "Invalid token" });
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

      // Check admin requirement
      if (requireAdmin && dbUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Add user info to request
      (req as AuthenticatedRequest).user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        isVerified: dbUser.is_verified,
      };
      (req as AuthenticatedRequest).isAuthenticated = true;

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res
        .status(500)
        .json({ error: "Internal server error in auth middleware" });
    }
  };
}
