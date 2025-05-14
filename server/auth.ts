import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { DatabaseStorage } from "./storage";

// Create a storage instance
const storage = new DatabaseStorage();
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import MemoryStore from "memorystore";
import { sendVerificationEmail } from "./emailService";
import jwt from "jsonwebtoken";

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
const JWT_SECRET = process.env.JWT_SECRET || "carax-finance-verification-secret";

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
export function generateEmailVerificationToken(userId: number, email: string): string {
  // Create a JWT token with user ID and email
  const token = jwt.sign(
    { 
      userId, 
      email,
      purpose: 'email-verification' 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return token;
}

// Save verification token to the database
export async function saveVerificationToken(userId: number, token: string): Promise<boolean> {
  try {
    const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);
    await storage.updateUser(userId, { 
      verificationToken: token,
      verificationTokenExpiry: tokenExpiry
    });
    return true;
  } catch (error) {
    console.error('Error saving verification token:', error);
    return false;
  }
}

// Validate a verification token and mark user as verified if valid
export async function verifyUserEmail(token: string): Promise<{ user: SelectUser } | null> {
  try {
    // Verify the JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, email: string };
    
    // Get the user from the database
    const user = await storage.getUserByVerificationToken(token);
    
    if (!user) {
      return null;
    }
    
    // Check that user IDs match
    if (user.id !== decoded.userId) {
      return null;
    }
    
    // Check if token is expired
    const tokenExpiry = user.verificationTokenExpiry;
    if (!tokenExpiry || new Date() > tokenExpiry) {
      return null;
    }
    
    // Update user as verified and clear token
    const updatedUser = await storage.updateUser(user.id, { 
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null
    });
    
    if (!updatedUser) {
      return null;
    }

    // Create activity log
    await storage.createLog({
      type: "info",
      userId: user.id,
      message: "Email verified"
    });
    
    return { user: updatedUser };
  } catch (error) {
    console.error('Error verifying email:', error);
    return null;
  }
}

// Resend verification email for a user
export async function resendVerificationEmail(userId: number): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    
    if (!user || user.isVerified) {
      return false;
    }
    
    // Generate new token
    const token = generateEmailVerificationToken(userId, user.email);
    
    // Save token to database
    await saveVerificationToken(userId, token);
    
    // Send verification email
    await sendVerificationEmail(user, token);
    
    return true;
  } catch (error) {
    console.error('Error resending verification email:', error);
    return false;
  }
}

// Check if a user needs to verify their email
export function requireEmailVerification(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }

  const user = req.user as BaseUser;
  
  // Skip verification requirement for admin users
  if (user.role === 'admin') {
    return next();
  }
  
  if (!user.isVerified) {
    return res.status(403).json({
      message: "Email verification required",
      verificationRequired: true
    });
  }
  
  next();
}

// Check if current user is an admin
export function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }

  const user = req.user as BaseUser;
  
  if (user.role !== 'admin') {
    return res.status(403).json({
      message: "Admin access required",
      forbidden: true
    });
  }
  
  next();
}

export function setupAuth(app: Express) {
  // Use memory store for development and PostgreSQL for production
  let store;

  if (process.env.NODE_ENV === 'production') {
    const PostgresSessionStore = connectPg(session);
    try {
      store = new PostgresSessionStore({
        pool,
        tableName: 'session',
        createTableIfMissing: true
      });
    } catch (error) {
      console.error('Failed to create PostgreSQL session store:', error);
      // Fallback to memory store if PostgreSQL store fails
      const MemoryStoreSession = MemoryStore(session);
      store = new MemoryStoreSession({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    }
  } else {
    // Use memory store for development
    const MemoryStoreSession = MemoryStore(session);
    store = new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "carax-finance-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    store
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        let passwordMatches = false;
        try {
          // First try direct comparison (for dev environment)
          passwordMatches = user.password === password;
          
          // If passwords don't match and it looks like a hashed password, try comparing with hash
          if (!passwordMatches && user.password.includes('.')) {
            passwordMatches = await comparePasswords(password, user.password);
          }
        } catch (error) {
          console.error('Password comparison error:', error);
          passwordMatches = false;
        }
        
        if (!passwordMatches) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        if (!user.isActive) {
          console.log(`Inactive account: ${username}`);
          return done(null, false, { message: "Account is inactive" });
        }
        
        console.log(`Successful login for: ${username}`);
        return done(null, user as Express.User);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(null, false, { message: "An error occurred during login. Please try again." });
      }
    }),
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

      // Create user with default values
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: "user",
        balance: "0",
        isActive: true,
        isVerified: false,
        twoFactorEnabled: false,
        referredBy: req.body.referredBy || null
      });

      // Check if user was created successfully
      if (!user) {
        return res.status(500).json({ message: "Failed to create user account" });
      }

      // Create an activity log
      await storage.createLog({
        type: "info",
        userId: user.id,
        message: "User account created"
      });

      // Generate verification token and send verification email
      const token = generateEmailVerificationToken(user.id, user.email);
      
      // Save token to database
      await saveVerificationToken(user.id, token);
      
      // Send the verification email
      await sendVerificationEmail(user, token);

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);

        // Safe to destructure as we've checked user is not undefined
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          ...userWithoutPassword,
          message: "Please check your email to verify your account"
        });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Add verify email endpoint
  app.get("/api/verify-email/:token", async (req, res) => {
    const { token } = req.params;
    
    try {
      const result = await verifyUserEmail(token);
      
      if (result) {
        if (req.isAuthenticated()) {
          // If user is already logged in, refresh their session
          const user = await storage.getUser((req.user as Express.User).id);
          if (user) {
            const { password, ...userWithoutPassword } = user;
            req.login(userWithoutPassword as SelectUser, () => {});
          }
        }
        
        return res.status(200).json({
          success: true,
          message: "Email verified successfully"
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token"
        });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while verifying your email"
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
          message: "Verification email sent"
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Could not send verification email"
        });
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while sending verification email"
      });
    }
  });

  // Add a health check endpoint for client connectivity testing
  app.get("/api/health", (req, res) => {
    // Set CORS headers explicitly for the health endpoint
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET');
    
    // Return a simple health status
    return res.status(200).json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  app.post("/api/login", async (req, res, next) => {
    // Set CORS headers explicitly for the login endpoint
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    try {
      console.log('Login attempt received for:', req.body?.username);
      
      // Check database connection before attempting login
      if (global.dbConnectionIssues) {
        console.warn('Login attempt during database connection issues');
        return res.status(503).json({ 
          message: "Unable to connect to the server. Please try again later.",
          error: "database_connection_issue"
        });
      }

      // Validate required fields
      if (!req.body?.username || !req.body?.password) {
        return res.status(400).json({ 
          message: "Username and password are required",
          error: "missing_credentials"
        });
      }

      // Add a timeout to prevent hanging login requests
      const loginTimeout = setTimeout(() => {
        console.error('Login request timed out for user:', req.body.username);
        return res.status(504).json({ 
          message: "Login request timed out. Please try again later.",
          error: "request_timeout"
        });
      }, 15000); // 15 second timeout

      passport.authenticate("local", (err: Error, user: Express.User, info: any) => {
        // Clear the timeout as we got a response
        clearTimeout(loginTimeout);

        if (err) {
          console.error('Login error for user:', req.body.username, err);
          return res.status(500).json({ 
            message: "An error occurred during login. Please try again.",
            error: "authentication_error"
          });
        }

        if (!user) {
          console.log('Authentication failed for user:', req.body.username);
          return res.status(401).json({ 
            message: info?.message || "Authentication failed. Please check your credentials.",
            error: "invalid_credentials"
          });
        }

        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('Session creation error for user:', req.body.username, loginErr);
            return res.status(500).json({ 
              message: "Failed to create session. Please try again.",
              error: "session_error"
            });
          }

          console.log('Login successful for user:', req.body.username);
          
          // Create login activity log
          storage.createLog({
            type: "info",
            userId: user.id,
            message: "User logged in",
            details: { ip: req.ip }
          }).catch(error => {
            console.error('Failed to create login log:', error);
          });

          const { password, ...userWithoutPassword } = user;
          
          // Set cookie explicitly
          if (!req.session.cookie.maxAge) {
            req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day
          }
          
          // Save session explicitly before sending response
          req.session.save(err => {
            if (err) {
              console.error('Session save error:', err);
            }
            
            return res.json(userWithoutPassword);
          });
        });
      })(req, res, next);
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return res.status(500).json({ 
        message: "An unexpected error occurred. Please try again later.",
        error: "unexpected_error"
      });
    }
  });

  app.post("/api/logout", (req, res) => {
    if (req.user) {
      const userId = (req.user as Express.User).id;

      // Create logout activity log
      storage.createLog({
        type: "info",
        userId,
        message: "User logged out"
      }).catch(console.error);
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
}