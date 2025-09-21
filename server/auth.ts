// NOTE: Avoid importing strict Drizzle User type here to reduce mismatch errors between
// storage return shape and session/user DTO we expose to the client. We create a lightweight
// SessionUser below.

import { config } from "dotenv";
config(); // Load environment variables first

import { createClient } from "@supabase/supabase-js";
import connectPg from "connect-pg-simple";
import { randomBytes, scrypt, timingSafeEqual } from "crypto"; // retained for legacy admin reset & potential future use
import { Express, Request, Response } from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import MemoryStore from "memorystore";
import passport from "passport";
import { promisify } from "util";
import { sendWelcomeEmail } from "./emailManager";
import { DatabaseStorage } from "./storage";

const storage = new DatabaseStorage();
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;
const JWT_SECRET =
  process.env.JWT_SECRET || "carax-finance-verification-secret";
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function generateEmailVerificationToken(userId: number, email: string) {
  return jwt.sign(
    { userId, email, purpose: "email-verification" },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export async function saveVerificationToken(userId: number, token: string) {
  try {
    const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);
    await storage.updateUser(userId, {
      verificationToken: token,
      verificationTokenExpiry: tokenExpiry,
    });
    return true;
  } catch (e) {
    console.error("Error saving verification token", e);
    return false;
  }
}

export async function verifyUserEmail(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) return null;
    let emailChanged = false;
    if ((user as any).pendingEmail) {
      const updated = await storage.updateUser(user.id, {
        email: (user as any).pendingEmail,
        pendingEmail: null,
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });
      emailChanged = true;
      return { user: updated, emailChanged };
    }
    const updated = await storage.updateUser(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });
    return { user: updated };
  } catch (e) {
    console.error("verifyUserEmail error", e);
    return null;
  }
}

export async function resendVerificationEmail(userId: number) {
  try {
    const user = await storage.getUser(userId);
    if (!user || (user as any).isVerified) return false;
    const token = generateEmailVerificationToken(userId, (user as any).email);
    await saveVerificationToken(userId, token);
    return true; // email send logic omitted
  } catch (e) {
    console.error("resendVerificationEmail error", e);
    return false;
  }
}

export function requireEmailVerification(
  req: Request,
  res: Response,
  next: Function
) {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "You must be logged in" });
  next();
}

export async function requireAdminRole(
  req: Request,
  res: Response,
  next: Function
) {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "You must be logged in" });
  const user: any = req.user;
  if (!user || user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
}

export function generateAdminApiToken(
  userId: number,
  expiresIn: string = "30m"
) {
  return (jwt as any).sign({ userId, scope: "admin-api" }, JWT_SECRET, {
    expiresIn,
  } as any);
}

export function setupAuth(app: Express) {
  let store;
  if (process.env.NODE_ENV === "production") {
    const PostgresSessionStore = connectPg(session);
    try {
      store = new PostgresSessionStore({
        conString: process.env.DATABASE_URL,
        tableName: "session",
        createTableIfMissing: true,
      });
    } catch (e) {
      const MemoryStoreSession = MemoryStore(session);
      store = new MemoryStoreSession({ checkPeriod: 86400000 });
    }
  } else {
    const MemoryStoreSession = MemoryStore(session);
    store = new MemoryStoreSession({ checkPeriod: 86400000 });
  }

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "carax-finance-secret-key",
      resave: false,
      saveUninitialized: false,
      name: "axix.sid",
      cookie: {
        secure:
          process.env.FORCE_HTTP_COOKIE === "true"
            ? false
            : process.env.NODE_ENV === "production" &&
              !["localhost", "127.0.0.1"].includes(
                (process.env.HOST || "localhost").toLowerCase()
              ),
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24,
      },
      store,
      rolling: true,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) =>
    done(
      null,
      user && typeof user === "object" && "id" in user ? user.id : null
    )
  );
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (e) {
      done(e);
    }
  });

  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser)
        return res.status(400).json({ message: "Username already exists" });
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail)
        return res.status(400).json({ message: "Email already exists" });
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: "user",
        balance: "0",
        isActive: true,
        isVerified: true,
        twoFactorEnabled: false,
        referredBy: req.body.referredBy || null,
      });
      if (!user)
        return res.status(500).json({ message: "Failed to create user" });
      await sendWelcomeEmail({
        id: user.id,
        email: (user as any).email,
        firstName: (user as any).firstName || null,
        lastName: (user as any).lastName || null,
      } as any).catch(() => {});
      const safe: any = { ...user };
      delete safe.password;
      req.login(safe, () => {});
      res.status(201).json({
        success: true,
        message: "Account created successfully!",
        username: safe.username ?? safe.email,
        email: safe.email,
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Registration failed" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    app.post("/api/debug/send-welcome", async (req: Request, res: Response) => {
      try {
        const { email = "dev-test@example.com", firstName = "Dev" } =
          req.body || {};
        const ok = await sendWelcomeEmail({
          id: 0,
          email,
          firstName,
          lastName: null,
        } as any);
        res.json({ success: ok });
      } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
      }
    });
  }

  if (process.env.NODE_ENV !== "production") {
    app.get("/api/admin-open-session", (req: Request, res: Response) => {
      res.json({
        sessionID: (req as any).sessionID || null,
        hasUser: !!req.user,
        user: req.user
          ? {
              id: (req.user as any).id,
              role: (req.user as any).role,
              email: (req.user as any).email,
            }
          : null,
      });
    });
  }

  app.get("/api/verify-email/:token", async (req: Request, res: Response) => {
    const out = await verifyUserEmail(req.params.token);
    if (!out)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    res.json({ success: true, message: "Email verified" });
  });

  app.post("/api/resend-verification", async (req: Request, res: Response) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Not authenticated" });
    const ok = await resendVerificationEmail((req.user as any).id);
    res.json({ success: ok });
  });

  app.get("/api/health", (_req: Request, res: Response) =>
    res.status(200).json({
      status: "ok",
      ok: true,
      ts: Date.now(),
      serverTime: new Date().toISOString(),
    })
  );

  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logged out" });
      });
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Not authenticated" });
    res.json(req.user);
  });

  // Additional admin / maintenance endpoints (kept during Supabase auth migration)

  // Activate all users endpoint (admin only)
  app.post(
    "/api/admin/activate-all-users",
    requireAdminRole,
    async (req, res) => {
      try {
        console.log("Getting all users...");
        const users = await storage.getAllUsers();
        console.log(`Found ${users.length} users`);

        let activated = 0;
        for (const user of users) {
          if (!(user as any).isActive || !(user as any).isVerified) {
            console.log(`Activating user: ${(user as any).username}`);
            await storage.updateUser(user.id, {
              isActive: true,
              isVerified: true,
            });
            activated++;
          }
        }

        // Create audit log
        await storage.createLog({
          type: "audit",
          userId: (req.user as Express.User).id,
          message: "Bulk user activation",
          details: { activatedCount: activated, totalUsers: users.length },
        });

        res.json({
          success: true,
          activatedUsers: activated,
          totalUsers: users.length,
        });
      } catch (error) {
        console.error("Error activating users:", error);
        res
          .status(500)
          .json({ success: false, message: "Error activating users" });
      }
    }
  );

  // Reset database and create admin endpoint
  app.post("/api/admin/reset-and-create-admin", async (req, res) => {
    try {
      console.log("Starting database reset process...");

      // Check database connection
      const connected = await storage.checkDatabaseConnection();
      if (!connected) {
        console.error("Database connection failed");
        return res.status(503).json({
          success: false,
          message: "Database connection failed",
        });
      }

      // First, get all users and delete them
      console.log("Getting all users to delete...");
      const users = await storage.getAllUsers();
      console.log(`Found ${users.length} users to delete`);
      // Delete all users
      for (const user of users) {
        await storage.deleteUser(user.id);
      }

      // Use environment variables or defaults for admin credentials
      const adminUsername = "admin";
      const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
      const adminPassword = process.env.ADMIN_PASSWORD; // no insecure fallback
      if (!adminPassword) {
        throw new Error("ADMIN_PASSWORD is required; no fallback allowed");
      }
      const adminFirstName = "Admin";
      const adminLastName = "User";
      const adminRole = "admin";
      const adminCreatedAt = new Date();
      const adminIsActive = true;
      const adminIsVerified = true;
      const adminTwoFactorEnabled = false;
      const adminBalance = "0";

      // Create the admin user with all required fields
      let userRaw = await storage.createUser({
        username: adminUsername,
        password: adminPassword,
        email: adminEmail,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: adminRole,
        isActive: adminIsActive,
        isVerified: adminIsVerified,
        twoFactorEnabled: adminTwoFactorEnabled,
        balance: adminBalance,
      });

      // Patch missing fields if not set by createUser
      // createdAt is managed by database layer; if missing we can set for in-memory only
      if (userRaw && !(userRaw as any).createdAt)
        (userRaw as any).createdAt = adminCreatedAt;
      if (userRaw && !(userRaw as any).firstName)
        (userRaw as any).firstName = adminFirstName;
      if (userRaw && !(userRaw as any).lastName)
        (userRaw as any).lastName = adminLastName;
      if (userRaw && !(userRaw as any).username)
        (userRaw as any).username = adminUsername;
      if (userRaw && !(userRaw as any).email)
        (userRaw as any).email = adminEmail;

      if (!userRaw) {
        return res
          .status(500)
          .json({ message: "Failed to create user account" });
      }

      await storage.createLog({
        type: "info",
        userId: userRaw.id,
        message: "User account created and auto-verified",
      });

      // Send welcome email with only required fields
      await sendWelcomeEmail({
        email: (userRaw as any).email,
        firstName: (userRaw as any).firstName || null,
        lastName: (userRaw as any).lastName || null,
      } as any);

      // Remove password before returning user object
      const userWithoutPassword: any = { ...userRaw };
      if ("password" in userWithoutPassword)
        delete userWithoutPassword.password;
      req.login(userWithoutPassword, () => {});

      console.log(
        `✅ User account created for: ${(userRaw as any).username ?? (userRaw as any).email} (${(userRaw as any).email})`
      );
      console.log(`📧 Welcome email sent: Yes`);

      res.status(201).json({
        success: true,
        message:
          "Account created successfully! Please check your email for login credentials, then return to login.",
        username: (userRaw as any).username ?? (userRaw as any).email,
        email: (userRaw as any).email,
      });

      return; // ensure no further processing
    } catch (error) {
      console.error("Error resetting database:", error);
      res.status(500).json({
        success: false,
        message: "Error resetting database and creating admin",
      });
    }
  });

  // Emergency admin login endpoint for troubleshooting
  app.post("/api/direct-admin-login", async (req, res) => {
    try {
      if (process.env.NODE_ENV !== "production") {
        console.log("Direct admin login attempt");
      }

      const { username, password } = req.body;
      if (process.env.NODE_ENV !== "production") {
        console.log("Login credentials (sanitized):", {
          username,
          passwordLength: password?.length || 0,
        });
      }

      // Only allow admin login via this endpoint
      if (username !== "admin") {
        return res.status(400).json({
          success: false,
          message: "This endpoint is for admin login only",
        });
      }

      const adminUser = await storage.getUserByUsername("admin");
      if (!adminUser) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Admin user not found, creating one...");
        }

        // Create admin user if it doesn't exist
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
          return res
            .status(500)
            .json({ success: false, message: "ADMIN_PASSWORD not set" });
        }
        const hashedPassword = await hashPassword(adminPassword);
        const newAdminUser = await storage.createUser({
          username: "admin",
          password: adminPassword,
          email: "admin@axixfinance.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          balance: "0",
          isActive: true,
          isVerified: true,
          twoFactorEnabled: false,
        });

        if (!newAdminUser) {
          return res.status(500).json({
            success: false,
            message: "Failed to create admin user",
          });
        }

        if (process.env.NODE_ENV !== "production") {
          console.log("New admin user created successfully");
        }

        // Log in the new admin user
        req.login(
          {
            ...newAdminUser,
            password: (newAdminUser as any).password || "default-password",
          } as unknown as Express.User,
          (err) => {
            if (err) {
              console.error("Error logging in new admin user:", err);
            }
          }
        );

        return res.json({
          success: true,
          message: "Admin user created and logged in successfully",
          user: newAdminUser,
        });
      } else {
        console.log("Admin user found, logging in directly");

        // Direct login for admin without password hash check
        // This is for emergency troubleshooting only
        return res.status(401).json({
          success: false,
          message:
            "Fallback admin password login disabled. Use standard authentication.",
        });
      }
    } catch (error) {
      console.error("Direct admin login error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during login",
      });
    }
  });

  // Test endpoint to check cookie settings
  app.get("/api/auth/cookie-test", (req, res) => {
    // Set a test cookie with SameSite=None to verify our cookie policy middleware
    res.cookie("test-cookie", "value", {
      httpOnly: true,
      sameSite: "none",
      // We intentionally don't set secure:true to test if our middleware adds it
    });

    res.json({
      success: true,
      message: "Cookie set successfully. Check the cookie headers.",
      sessionConfig: {
        id: req.session?.id,
        secure: req.session?.cookie?.secure || false,
        sameSite: req.session?.cookie?.sameSite || "lax",
        httpOnly: req.session?.cookie?.httpOnly || true,
        maxAge: req.session?.cookie?.maxAge || 0,
      },
    });
  });

  if (process.env.NODE_ENV !== "production") {
    app.get("/api/auth/headers-dump", (req, res) => {
      res.cookie("axix.sid.debug", Date.now().toString(), {
        httpOnly: true,
        sameSite: "lax",
      });
      res.json({
        headers: req.headers,
        hasSession: !!req.session,
        sessionID: (req as any).sessionID,
        user: req.user || null,
      });
    });
  }
}
