import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./storage";
import { setupWebSocketServer } from "./websocketServer";

// Create a storage instance
const storage = new DatabaseStorage();
import { type User as DbUser, type Transaction, type InsertUser } from "@shared/schema";
import { z } from "zod";
import { setupAuth, verifyUserEmail, resendVerificationEmail, requireEmailVerification, comparePasswords, hashPassword } from "./auth";
import express from 'express';
import { sendVerificationEmail } from './emailService';
import { pool } from './db';
import notificationRoutes from './notificationRoutes';

// Define base user interface to avoid recursion
interface BaseUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  isActive: boolean;
  role: string;
  balance: string;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface User extends BaseUser {}
  }
}

const router = express.Router();

// Authenticated middleware - moved to the top before it's used
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized: Login required" });
  }
  next();
};



// Email verification routes
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    const verificationResult = await verifyUserEmail(token);
    
    if (!verificationResult || !verificationResult.user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    return res.status(200).json({ 
      message: 'Email verified successfully',
      user: {
        id: verificationResult.user.id,
        username: verificationResult.user.username,
        email: verificationResult.user.email,
        isVerified: verificationResult.user.isVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
});

router.post('/resend-verification', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Resend verification email
    await resendVerificationEmail(userId);
    
    return res.status(200).json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ message: 'Failed to resend verification email' });
  }
});

// Development-only route for manually verifying a user
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/verify-user/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.isVerified) {
        return res.status(400).json({ message: 'User is already verified' });
      }
      
      const updatedUser = await storage.updateUser(user.id, {
        isVerified: true,
        verificationToken: null
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user verification status' });
      }
      
      console.log(`🔧 Development mode: User ${email} has been manually verified`);
      
      return res.status(200).json({
        message: 'User verified successfully (DEVELOPMENT MODE ONLY)',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          isVerified: updatedUser.isVerified
        }
      });
    } catch (error) {
      console.error('Dev verification error:', error);
      return res.status(500).json({ message: 'Failed to manually verify user' });
    }
  });
}

// User profile routes
router.get('/profile', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Failed to get user profile' });
  }
});

router.put('/profile', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { firstName, lastName, username } = req.body;
    
    if (username && username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }
    
    if (username) {
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    const updatedUser = await storage.updateUser(userId, {
      firstName,
      lastName,
      username
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Failed to update user profile' });
    }

    return res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isVerified: updatedUser.isVerified,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Failed to update user profile' });
  }
});

// Change password route
router.post('/change-password', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isPasswordValid = await comparePasswords(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await hashPassword(newPassword);
    
    await storage.updateUser(userId, {
      password: hashedPassword
    });
    
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Failed to change password' });
  }
});

// Export the router
export default router;

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Apply the router to the app
  app.use('/api', router);
  
  // Apply notification routes
  app.use('/api/notifications', notificationRoutes);

















  // Transactions endpoints
  app.get("/api/transactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Only allow users to see their own transactions
      const transactions = await storage.getUserTransactions(userId);
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  app.get("/api/transactions/pending", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Only allow users to see their own pending transactions
      const transactions = await storage.getUserTransactions(userId);
      const pendingTransactions = transactions.filter(t => t.status === 'pending');
      res.status(200).json(pendingTransactions);
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      res.status(500).json({ message: 'Failed to fetch pending transactions' });
    }
  });
  
  // User-specific transactions endpoint
  app.get("/api/transactions/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Only allow users to access their own transactions
      if (req.user?.id !== userId) {
        return res.status(403).json({ message: 'You do not have permission to view these transactions' });
      }
      
      const transactions = await storage.getUserTransactions(userId);
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      res.status(500).json({ message: 'Failed to fetch user transactions' });
    }
  });


  
  // Settings endpoints
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });
  
  app.get("/api/settings/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const setting = await storage.getSetting(name);
      
      if (!setting) {
        return res.status(404).json({ message: `Setting "${name}" not found` });
      }
      
      res.status(200).json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ message: 'Failed to fetch setting' });
    }
  });
  

  
  // Existing endpoints
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        res.status(200).json({ 
          status: "ok", 
          message: "Server is running",
          databaseConnected: true
        });
      } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ 
          status: "error", 
          message: "Server is running but database query failed",
          databaseConnected: false
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ 
        status: "error", 
        message: "Server is running but database connection failed",
        databaseConnected: false
      });
    }
  });
  
  // Debug endpoint to list database tables (only available in development mode)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/debug/tables", async (req: Request, res: Response) => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
          `);
          res.status(200).json({
            tables: result.rows.map(row => row.table_name)
          });
        } catch (error) {
          console.error('Error listing tables:', error);
          res.status(500).json({ error: 'Failed to list tables' });
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection failed' });
      }
    });
  }
  
  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      const result = await verifyUserEmail(token);
      
      if (!result || !result.user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      return res.status(200).json({ 
        message: "Email verified successfully. You can now log in to your account.",
        userId: result.user.id
      });
    } catch (error) {
      console.error("Email verification error:", error);
      return res.status(500).json({ message: "An error occurred while verifying your email" });
    }
  });
  
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        console.log(`Password reset requested for ${email}`);
      }
      
      return res.status(200).json({ message: "If this email is associated with an account, you will receive password reset instructions." });
    } catch (error) {
      console.error("Error in forgot-password:", error);
      return res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      console.log(`Password reset with token: ${token}`);
      
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset-password:", error);
      return res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  setupWebSocketServer(httpServer);
  
  return httpServer;
}
