import { createClient } from "@supabase/supabase-js";
import { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  username: z.string().min(3),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.VITE_FRONTEND_URL || "https://axix-finance.vercel.app"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const { action } = req.query;

    if (req.method === "POST" && action === "login") {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: result.error.errors });
      }

      const { email, password } = result.data;

      // Find user
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (userError || !user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({ error: "Account deactivated" });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        message: "Login successful",
        token,
        user: userWithoutPassword,
      });
    }

    if (req.method === "POST" && action === "register") {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: result.error.errors });
      }

      const { email, password, firstName, lastName, username } = result.data;

      // Check if user already exists
      const { data: existingUsers, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .or(`email.eq.${email.toLowerCase()},username.eq.${username}`);

      if (existingUserError) {
        return res.status(500).json({ error: "Internal server error" });
      }

      if (existingUsers && existingUsers.length > 0) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const { data: newUser, error: newUserError } = await supabase
        .from("users")
        .insert([
          {
            email: email.toLowerCase(),
            password: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            username: username,
            role: "user",
            is_verified: false,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select(
          "id, email, first_name, last_name, username, role, is_verified, is_active, created_at"
        )
        .single();

      if (newUserError) {
        return res.status(500).json({ error: "Internal server error" });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );

      return res.status(201).json({
        message: "Registration successful",
        token,
        user: newUser,
      });
    }

    return res.status(404).json({ error: "Endpoint not found" });
  } catch (error) {
    console.error("Auth API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
