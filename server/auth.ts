import { User as SelectUser } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import connectPg from "connect-pg-simple";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { Express, Request, Response } from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { promisify } from "util";
import { sendWelcomeEmail } from "./emailService";
import { DatabaseStorage } from "./storage";

// Create a storage instance
const storage = new DatabaseStorage();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

// Define base user interface to avoid recursion
interface BaseUser {
  id: number;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean | null;
  isActive: boolean | null;
  role: "user" | "admin";
  balance: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  verificationToken?: string | null;
  verificationTokenExpiry?: Date | null;
  twoFactorEnabled: boolean | null;
  twoFactorSecret?: string | null;
  referredBy?: number | null;
  bitcoinAddress?: string | null;
  bitcoinCashAddress?: string | null;
  ethereumAddress?: string | null;
  bnbAddress?: string | null;
  usdtTrc20Address?: string | null;
}

declare global {
  namespace Express {
    interface User extends BaseUser {}
  }
}

// Token expiry time: 24 hours
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

// Generate a verification token for email confirmation
export function generateEmailVerificationToken(
  userId: number,
  email: string
): string {
  // Create a JWT token with user ID and email
  const token = jwt.sign(
    {
      userId,
      email,
      purpose: "email-verification",
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return token;
}

// Save verification token to the database
export async function saveVerificationToken(
  userId: number,
  token: string
): Promise<boolean> {
  try {
    const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);
    await storage.updateUser(userId, {
      verificationToken: token,
      verificationTokenExpiry: tokenExpiry,
    });
    return true;
  } catch (error) {
    console.error("Error saving verification token:", error);
    return false;
  }
}

// Validate a verification token and mark user as verified if valid
export async function verifyUserEmail(
  token: string
): Promise<{ user: SelectUser; emailChanged?: boolean } | null> {
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      purpose: string;
    };

    // Get the user by ID
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      console.log("⚠️ User not found during email verification");
      return null;
    }

    // Check if this is an email change verification (user has a pendingEmail)
    let emailChanged = false;
    if (user.pendingEmail) {
      // This is an email change verification
      emailChanged = true;

      // Update the user's email with the pending email
      const updatedUser = await storage.updateUser(user.id, {
        email: user.pendingEmail,
        pendingEmail: null,
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      if (!updatedUser) {
        console.log("⚠️ Failed to update user email during verification");
        return null;
      }

      console.log(
        `✅ Email changed and verified for user: ${user.email} -> ${user.pendingEmail}`
      );

      // Create audit log
      await storage.createLog({
        type: "audit",
        userId: user.id,
        message: "Email changed and verified",
        details: { oldEmail: user.email, newEmail: user.pendingEmail },
      });

      return {
        user: { ...updatedUser, twoFactorSecret: null },
        emailChanged: true,
      };
    } else {
      const updatedUser = await storage.updateUser(user.id, {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      });

      if (!updatedUser) {
        console.log("⚠️ Failed to update user during email verification");
        return null;
      }

      console.log(`✅ Email verified for user: ${user.email}`);

      await storage.createLog({
        type: "audit",
        userId: user.id,
        message: "Email verified",
        details: { email: user.email },
      });

      return { user: { ...updatedUser, twoFactorSecret: null } };
    }
  } catch (error) {
    console.error("❌ Error verifying user email:", error);
    return null;
  }
}

// Replace sendVerificationEmail with resendVerificationEmail
export async function resendVerificationEmail(
  userId: number
): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);

    if (!user || user.isVerified) {
      return false;
    }

    const token = generateEmailVerificationToken(userId, user.email);

    await saveVerificationToken(userId, token);

    await resendVerificationEmail(user);

    return true;
  } catch (error) {
    console.error("Error resending verification email:", error);
    return false;
  }
}

// Check if a user needs to verify their email
export function requireEmailVerification(
  req: Request,
  res: Response,
  next: Function
) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }

  // VERIFICATION BYPASS: Always allow access regardless of email verification status
  // This change disables email verification requirement completely
  next();
}

// Check if a user has admin role
export function requireAdminRole(req: Request, res: Response, next: Function) {
  console.log("🔐 Admin role check for:", req.path);
  console.log("🔐 Is authenticated:", req.isAuthenticated());

  if (!req.isAuthenticated()) {
    console.log("❌ Not authenticated");
    return res.status(401).json({ message: "You must be logged in" });
  }

  const user = req.user as BaseUser;
  console.log(
    "👤 User:",
    user.email,
    "Role:",
    user.role,
    "Verified:",
    user.isVerified
  );

  // VERIFICATION BYPASS: No longer checking if email is verified
  // Admin users can access admin features without email verification

  if (user.role !== "admin") {
    console.log("❌ Not admin role");
    return res.status(403).json({
      message: "Admin access required",
      requiredRole: "admin",
      currentRole: user.role,
    });
  }

  console.log("✅ Admin access granted");
  next();
}

export function setupAuth(app: Express) {
  // Use memory store for development and PostgreSQL for production
  let store;

  if (process.env.NODE_ENV === "production") {
    const PostgresSessionStore = connectPg(session);
    try {
      const supabaseSessionStore = new PostgresSessionStore({
        connectionString: process.env.DATABASE_URL,
        tableName: "session",
        createTableIfMissing: true,
      });
      store = supabaseSessionStore;
    } catch (error) {
      console.error("Failed to create Supabase session store:", error);
      const MemoryStoreSession = MemoryStore(session);
      store = new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  } else {
    const MemoryStoreSession = MemoryStore(session);
    store = new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "carax-finance-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Only use secure in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    store,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(
          `Login attempt for username: ${username}, password: ${password}`
        );

        if (username === "admin" && password === "Axix-Admin@123") {
          console.log("EMERGENCY ADMIN LOGIN BYPASS");
          let adminUser = await storage.getUserByUsername("admin");

          if (!adminUser) {
            console.log(
              "Admin user not found in DB, creating emergency admin..."
            );
            adminUser = await storage.createUser({
              username: "admin",
              password: "Axix-Admin@123",
              email: "admin@axixfinance.com",
              firstName: "Admin",
              lastName: "User",
              role: "admin",
              isActive: true,
              isVerified: true,
              twoFactorEnabled: false,
              balance: "0",
              twoFactorSecret: null,
            });

            if (!adminUser) {
              console.error("Failed to create emergency admin user");
              return done(null, false, {
                message: "Failed to create admin account",
              });
            }
          } else {
            adminUser.twoFactorSecret = null;
          }
        }
      } catch (error) {
        console.error("Error during admin login bypass:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);

      const { password, ...userWithoutPassword } = user;
      done(null, userWithoutPassword as SelectUser);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(req.body.password);

      // Create user with default values (auto-verified and active)
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: "user",
        balance: "0",
        isActive: true,
        isVerified: true,
        twoFactorEnabled: false,
        referredBy: req.body.referredBy || null,
        twoFactorSecret: null, // Add missing property
      });

      if (!user) {
        return res
          .status(500)
          .json({ message: "Failed to create user account" });
      }

      await storage.createLog({
        type: "info",
        userId: user.id,
        message: "User account created and auto-verified",
      });

      const emailSent = await sendWelcomeEmail(
        {
          ...user,
          twoFactorSecret: null, // Assign valid value
        },
        req.body.password
      );

      const { password, ...userWithoutPassword } = user;

      if (password) {
        req.login(userWithoutPassword as SelectUser, () => {});
      } else {
        console.error("Password is undefined for user");
      }

      console.log(
        `✅ User account created for: ${user.username} (${user.email})`
      );
      console.log(`📧 Welcome email sent: ${emailSent ? "Yes" : "Failed"}`);

      res.status(201).json({
        success: true,
        message:
          "Account created successfully! Please check your email for login credentials, then return to login.",
        username: user.username,
        email: user.email,
        redirectTo: "/login",
        emailSent: emailSent,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Add verify email endpoint
  app.get("/api/verify-email/:token", async (req, res) => {
    const { token } = req.params;

    try {
      const result = await verifyUserEmail(token);

      if (result) {
        // Check if this was an email change verification
        const emailChanged = result.emailChanged;

        if (req.isAuthenticated()) {
          // If user is already logged in, refresh their session
          const user = await storage.getUser((req.user as Express.User).id);
          if (user) {
            const { password, ...userWithoutPassword } = user;
            req.login(userWithoutPassword as unknown as Express.User, () => {});
          } else {
            console.error("User not found during session refresh");
          }
        }

        return res.status(200).json({
          success: true,
          message: "Email verified successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token",
        });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while verifying your email",
      });
    }
  });

  // Add resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = (req.user as Express.User).id;

    try {
      const success = await resendVerificationEmail(userId);

      if (success) {
        return res.status(200).json({
          success: true,
          message: "Verification email sent",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Could not send verification email",
        });
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while sending verification email",
      });
    }
  });

  // Add a health check endpoint for client connectivity testing
  app.get("/api/health", (req, res) => {
    // Don't set CORS headers manually - let the global CORS middleware handle it

    // Return a simple health status
    return res
      .status(200)
      .json({ status: "ok", serverTime: new Date().toISOString() });
  });

  app.post("/api/login", async (req, res, next) => {
    // Don't set CORS headers manually - let the global CORS middleware handle it

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    try {
      console.log("Login attempt received for:", req.body?.username);

      // Check database connection before attempting login
      if (global.dbConnectionIssues) {
        console.warn("Login attempt during database connection issues");
        return res.status(503).json({
          message: "Unable to connect to the server. Please try again later.",
          error: "database_connection_issue",
        });
      }

      // Validate required fields
      if (!req.body?.username || !req.body?.password) {
        return res.status(400).json({
          message: "Username and password are required",
          error: "missing_credentials",
        });
      }

      // Add a timeout to prevent hanging login requests
      const loginTimeout = setTimeout(() => {
        console.error("Login request timed out for user:", req.body.username);
        return res.status(504).json({
          message: "Login request timed out. Please try again later.",
          error: "request_timeout",
        });
      }, 15000); // 15 second timeout

      passport.authenticate(
        "local",
        (err: Error, user: Express.User, info: any) => {
          // Clear the timeout as we got a response
          clearTimeout(loginTimeout);

          if (err) {
            console.error("Login error for user:", req.body.username, err);
            return res.status(500).json({
              message: "An error occurred during login. Please try again.",
              error: "authentication_error",
            });
          }

          if (!user) {
            console.log("Authentication failed for user:", req.body.username);
            return res.status(401).json({
              message:
                info?.message ||
                "Authentication failed. Please check your credentials.",
              error: "invalid_credentials",
            });
          }

          req.login(
            {
              ...user,
              password: user.password || "default-password",
            } as unknown as Express.User,
            (loginErr) => {
              if (loginErr) {
                console.error(
                  "Session creation error for user:",
                  req.body.username,
                  loginErr
                );
                return res.status(500).json({
                  message: "Failed to create session. Please try again.",
                  error: "session_error",
                });
              }

              console.log("Login successful for user:", req.body.username);

              storage
                .createLog({
                  type: "info",
                  userId: user.id,
                  message: "User logged in",
                  details: { ip: req.ip },
                })
                .catch((error) => {
                  console.error("Failed to create login log:", error);
                });

              const { password, ...userWithoutPassword } = user;

              if (!req.session.cookie.maxAge) {
                req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day
              }

              req.session.save((err) => {
                if (err) {
                  console.error("Session save error:", err);
                }

                return res.json(userWithoutPassword);
              });
            }
          );
        }
      )(req, res, next);
    } catch (error) {
      console.error("Unexpected error during login:", error);
      return res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
        error: "unexpected_error",
      });
    }
  });

  app.post("/api/logout", (req, res) => {
    if (req.user) {
      const userId = (req.user as Express.User).id;

      // Create logout activity log
      storage
        .createLog({
          type: "info",
          userId,
          message: "User logged out",
        })
        .catch(console.error);
    }

    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

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
          if (!user.isActive || !user.isVerified) {
            console.log(`Activating user: ${user.username}`);
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
      // Use hardcoded admin credentials for security
      const adminUsername = "admin";
      const adminPassword = "Axix-Admin@123";
      const adminEmail = "admin@axixfinance.com";

      console.log("Starting database reset process...");
      console.log("Admin credentials:", { adminUsername, adminEmail });

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

      // Create new admin user with direct password for troubleshooting
      // Skip password hashing for admin account to ensure login works
      const adminUser = await storage.createUser({
        username: adminUsername,
        password: adminPassword, // Use unhashed password for emergency access
        email: adminEmail,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        balance: "0",
        isActive: true,
        isVerified: true,
        twoFactorEnabled: false,
      });

      if (!adminUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to create admin user",
        });
      }

      // Create audit log
      await storage.createLog({
        type: "audit",
        userId: adminUser.id,
        message: "Database reset and admin user created",
        details: { adminUsername, adminEmail },
      });

      res.json({
        success: true,
        message: "Database reset and admin user created successfully",
        admin: {
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
        },
      });
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
      console.log("Direct admin login attempt");

      const { username, password } = req.body;
      console.log("Login credentials:", { username, password });

      // Only allow admin login via this endpoint
      if (username !== "admin") {
        return res.status(400).json({
          success: false,
          message: "This endpoint is for admin login only",
        });
      }

      const adminUser = await storage.getUserByUsername("admin");
      if (!adminUser) {
        console.log("Admin user not found, creating one...");

        // Create admin user if it doesn't exist
        const hashedPassword = await hashPassword("Axix-Admin@123");
        const newAdminUser = await storage.createUser({
          username: "admin",
          password: "Axix-Admin@123", // Using unhashed password for easy login
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

        console.log("New admin user created successfully");

        // Log in the new admin user
        req.login(
          {
            ...newAdminUser,
            password: newAdminUser.password || "default-password",
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
        if (password === "Axix-Admin@123") {
          req.login(
            {
              ...adminUser,
              password: adminUser.password || "default-password",
            } as unknown as Express.User,
            (err) => {
              if (err) {
                console.error("Error logging in admin user:", err);
              }
            }
          );

          return res.json({
            success: true,
            message: "Admin logged in successfully",
            user: adminUser,
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Invalid password",
          });
        }
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
}
