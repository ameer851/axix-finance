import { createClient } from "@supabase/supabase-js";
import { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: number;
    email: string;
    role: string;
    isVerified: boolean;
  };
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

export async function authenticateUser(
  req: AuthenticatedRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, error: "No token provided" };
    }

    const token = authHeader.substring(7);
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
      return { success: false, error: "User not found" };
    }

    if (!user.is_active) {
      return { success: false, error: "Account deactivated" };
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.is_verified,
    };

    return { success: true };
  } catch (error) {
    return { success: false, error: "Invalid token" };
  }
}

export function requireAuth(
  handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    const authResult = await authenticateUser(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    return handler(req, res);
  };
}

export function requireEmailVerification(
  handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>
) {
  return requireAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (!req.user?.isVerified) {
      return res.status(403).json({ error: "Email verification required" });
    }
    return handler(req, res);
  });
}

export function requireAdmin(
  handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>
) {
  return requireEmailVerification(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      return handler(req, res);
    }
  );
}
