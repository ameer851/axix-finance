import { createClient } from "@supabase/supabase-js";
import { VercelResponse } from "@vercel/node";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    isVerified?: boolean;
  };
  isAuthenticated(): boolean;
}eClient } from "@supabase/supabase-js";
import { VercelResponse } from "@vercel/node";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    email: string;
    role: string;
    isVerified?: boolean;
  };
  isAuthenticated(): boolean;
};

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    email: string;
    role: string;
    isVerified?: boolean;
  };
  isAuthenticated(): boolean;
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// Add types to Express Request
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      email: string;
      role: string;
      isVerified?: boolean;
    };
    isAuthenticated(): boolean;
  }
}

export const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin":
    process.env.VITE_FRONTEND_URL || "https://axix-finance.vercel.app",
  "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
};

export function setCorsHeaders(res: VercelResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export function requireAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
      setCorsHeaders(res);

      if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.isAuthenticated = () => false;
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "fallback-secret"
        ) as any;

        // Get user from Supabase to ensure they still exist and are active
        const { data: user, error } = await supabase
          .from("users")
          .select("id, email, first_name, last_name, role, is_verified, is_active")
          .eq("id", decoded.userId)
          .single();

        if (error || !user) {
          return res.status(401).json({ error: "User not found" });
        }

        if (!user.is_active) {
          return res.status(403).json({ error: "Account deactivated" });
        }

        // Set user data and isAuthenticated
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified,
        };
        req.isAuthenticated = () => true;

        // Call the handler with the authenticated request
        return handler(req, res);
      } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ error: "Internal server error in auth middleware" });
    }
  };
}

export function requireEmailVerification(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>) {
  return requireAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (!req.user?.isVerified) {
      res.status(403).json({ error: "Email verification required" });
      return;
    }
    return handler(req, res);
  });
}

export function requireAdmin(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>) {
  return requireEmailVerification(async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    return handler(req, res);
  });
}
