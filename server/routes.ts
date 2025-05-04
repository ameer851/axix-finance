import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTransactionSchema, insertMessageSchema, insertLogSchema } from "@shared/schema";
import { z } from "zod";

// Admin middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Get user from session or token (in a real app)
  // For simplicity, we'll check if user_id is admin's ID or role is passed in headers
  const isAdminUser = req.headers['x-user-role'] === 'admin';
  
  if (!isAdminUser) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user
      const newUser = await storage.createUser(validatedData);
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check password (in a real app, we would use bcrypt.compare)
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from users
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/transactions/pending", async (req: Request, res: Response) => {
    try {
      const pendingTransactions = await storage.getPendingTransactions();
      return res.status(200).json(pendingTransactions);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/transactions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transactions = await storage.getUserTransactions(userId);
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For withdrawal or investment, check if user has enough balance
      if (validatedData.type === "withdrawal" || validatedData.type === "investment") {
        const amount = parseFloat(validatedData.amount as string);
        const balance = parseFloat(user.balance as string);
        
        if (balance < amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
      }

      // Create transaction
      const newTransaction = await storage.createTransaction(validatedData);
      return res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes - protected by isAdmin middleware
  app.patch("/api/transactions/:id/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }

      const { status, rejectionReason } = req.body;
      if (status !== "completed" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status. Must be 'completed' or 'rejected'" });
      }

      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ message: "Can only update pending transactions" });
      }

      // Get admin ID (in real app would be from session/token)
      const adminId = parseInt(req.headers['x-user-id'] as string) || 1;

      const updatedTransaction = await storage.updateTransactionStatus(
        transactionId, 
        status, 
        adminId,
        rejectionReason
      );
      
      // Create log entry for audit trail
      await storage.createLog({
        type: "audit",
        message: `Transaction #${transactionId} status changed to ${status}`,
        userId: adminId,
        details: { 
          transactionId,
          previousStatus: "pending",
          newStatus: status,
          ...(rejectionReason && { rejectionReason })
        }
      });
      
      return res.status(200).json(updatedTransaction);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin user management routes
  app.patch("/api/users/:id/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get admin ID (in real app would be from session/token)
      const adminId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const updatedUser = await storage.updateUserActiveStatus(userId, isActive);
      
      // Log the action
      await storage.createLog({
        type: "audit",
        message: `User #${userId} ${isActive ? 'activated' : 'deactivated'}`,
        userId: adminId,
        details: { targetUserId: userId, action: isActive ? 'activate' : 'deactivate' }
      });
      
      const { password, ...userWithoutPassword } = updatedUser!;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin verification routes
  app.patch("/api/users/:id/verify", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { isVerified } = req.body;
      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ message: "isVerified must be a boolean" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get admin ID (in real app would be from session/token)
      const adminId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const updatedUser = await storage.updateUserVerificationStatus(userId, isVerified);
      
      // Log the action
      await storage.createLog({
        type: "audit",
        message: `User #${userId} ${isVerified ? 'verified' : 'verification revoked'}`,
        userId: adminId,
        details: { targetUserId: userId, action: isVerified ? 'verify' : 'revoke verification' }
      });
      
      const { password, ...userWithoutPassword } = updatedUser!;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin logs routes
  app.get("/api/logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const { limit, offset, type, userId, query } = req.query;
      
      let logs;
      if (type) {
        logs = await storage.getLogsByType(type as string as any);
      } else if (userId) {
        const userIdNum = parseInt(userId as string);
        if (isNaN(userIdNum)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }
        logs = await storage.getUserLogs(userIdNum);
      } else if (query) {
        logs = await storage.searchLogs(query as string);
      } else {
        logs = await storage.getLogs(
          limit ? parseInt(limit as string) : undefined,
          offset ? parseInt(offset as string) : undefined
        );
      }
      
      return res.status(200).json(logs);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Export logs as CSV
  app.get("/api/logs/export", isAdmin, async (req: Request, res: Response) => {
    try {
      const logs = await storage.getLogs(1000); // Limit to 1000 logs for export
      
      // Generate CSV string
      let csv = "id,type,message,userId,createdAt,ipAddress\n";
      
      logs.forEach(log => {
        csv += `${log.id},"${log.type}","${log.message.replace(/"/g, '""')}",${log.userId || ''},${log.createdAt},${log.ipAddress || ''}\n`;
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
      
      return res.status(200).send(csv);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Export users as CSV
  app.get("/api/users/export", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Generate CSV string
      let csv = "id,username,email,firstName,lastName,role,balance,isVerified,isActive,createdAt\n";
      
      users.forEach(user => {
        csv += `${user.id},"${user.username}","${user.email}","${user.firstName}","${user.lastName}",${user.role},${user.balance},${user.isVerified || false},${user.isActive || true},${user.createdAt}\n`;
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      
      return res.status(200).send(csv);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin search routes
  app.get("/api/search/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const users = await storage.searchUsers(query);
      
      // Remove sensitive information
      const safeUsers = users.map(user => {
        const { password, ...safe } = user;
        return safe;
      });
      
      return res.status(200).json(safeUsers);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/search/transactions", isAdmin, async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const transactions = await storage.searchTransactions(query);
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // System settings routes
  app.get("/api/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      return res.status(200).json(settings);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/settings/:name", isAdmin, async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const { value, description } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      // Get admin ID (in real app would be from session/token)
      const adminId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const setting = await storage.createOrUpdateSetting(name, value, description, adminId);
      
      // Log the action
      await storage.createLog({
        type: "audit",
        message: `System setting "${name}" updated`,
        userId: adminId,
        details: { setting: name, value, description }
      });
      
      return res.status(200).json(setting);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Support message routes
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newMessage = await storage.createMessage(validatedData);
      return res.status(201).json(newMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/messages", isAdmin, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getAllMessages();
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/messages/unread", isAdmin, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getUnreadMessages();
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:userId/messages", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const messages = await storage.getUserMessages(userId);
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/messages/:id/respond", isAdmin, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const { response } = req.body;
      if (!response || typeof response !== 'string') {
        return res.status(400).json({ message: "Response is required" });
      }
      
      // Get admin ID (in real app would be from session/token)
      const adminId = parseInt(req.headers['x-user-id'] as string) || 1;
      
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      const updatedMessage = await storage.respondToMessage(messageId, adminId, response);
      
      // Log the action
      await storage.createLog({
        type: "audit",
        message: `Responded to message #${messageId}`,
        userId: adminId,
        details: { messageId, userId: message.userId }
      });
      
      return res.status(200).json(updatedMessage);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Transaction filtering routes
  app.get("/api/transactions/filter", async (req: Request, res: Response) => {
    try {
      const { status, type, startDate, endDate } = req.query;
      
      let transactions = [];
      
      if (status) {
        transactions = await storage.getTransactionsByStatus(status as string as any);
      } else if (type) {
        transactions = await storage.getTransactionsByType(type as string as any);
      } else if (startDate && endDate) {
        transactions = await storage.getTransactionsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        transactions = await storage.getAllTransactions();
      }
      
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
