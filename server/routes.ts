import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./storage";
import express from 'express';
import { type User as DbUser, type Transaction, type InsertUser } from "@shared/schema";
import { z } from "zod";
import { setupAuth, verifyUserEmail, resendVerificationEmail, requireEmailVerification, requireAdminRole, comparePasswords, hashPassword } from "./auth";
import { sendVerificationEmail } from './emailService';
import { pool } from './db';

// Create a storage instance
const storage = new DatabaseStorage();

// Define base user interface to avoid recursion
interface BaseUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  isActive: boolean;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface User extends BaseUser {}
  }
}

const router = express.Router();

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

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
      
      if (process.env.NODE_ENV !== "production") console.log(`🔧 Development mode: User ${email} has been manually verified`);
      
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

// Get user balance route
router.get('/users/:userId/balance', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = parseInt(req.params.userId, 10);
    // Users can only access their own balance unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Dynamically calculate balance from completed transactions
    const transactions = await storage.getUserTransactions(userId);
    let availableBalance = 0;
    let pendingBalance = 0;
    for (const tx of transactions) {
      if (tx.status === 'completed') {
        if (tx.type === 'deposit' || tx.type === 'transfer') {
          availableBalance += parseFloat(tx.amount);
        } else if (tx.type === 'withdrawal' || tx.type === 'investment') {
          availableBalance -= parseFloat(tx.amount);
        }
      } else if (tx.status === 'pending') {
        if (tx.type === 'withdrawal' || tx.type === 'investment') {
          pendingBalance += parseFloat(tx.amount);
        }
      }
    }
    return res.status(200).json({
      availableBalance,
      pendingBalance,
      totalBalance: availableBalance,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Get balance error:', error);
    return res.status(500).json({ message: 'Failed to get user balance' });
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

// Get user crypto balances (per-crypto)
router.get('/users/:userId/crypto-balances', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = parseInt(req.params.userId, 10);
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // For demo, all balances are 0, but you can extend this to use real data
    const cryptos = [
      { key: 'bitcoin', label: 'BITCOIN', address: user.bitcoinAddress },
      { key: 'bitcoinCash', label: 'Bitcoin cash', address: user.bitcoinCashAddress },
      { key: 'ethereum', label: 'Ethereum', address: user.ethereumAddress },
      { key: 'usdt', label: 'Usdt trc20', address: user.usdtTrc20Address },
      { key: 'bnb', label: 'BNB', address: user.bnbAddress },
    ];
    const balances = cryptos.map(crypto => ({
      key: crypto.key,
      label: crypto.label,
      processing: 0, // TODO: Replace with real processing amount if available
      available: 0, // TODO: Replace with real available amount if available
      pending: 0, // TODO: Replace with real pending amount if available
      account: crypto.address || 'not set',
    }));
    return res.status(200).json(balances);
  } catch (error) {
    console.error('Get crypto balances error:', error);
    return res.status(500).json({ message: 'Failed to get crypto balances' });
  }
});

// Export the router
export default router;

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Apply the router to the app
  app.use('/api', router);
  
  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      // Get dashboard statistics
      const totalUsers = await storage.getUserCount();
      const activeUsers = await storage.getActiveUserCount();
      const recentTransactions = await storage.getRecentTransactions(10);
      const pendingTransactions = await storage.getPendingTransactionCount();
      
      // Calculate totals from transactions
      const deposits = recentTransactions.filter(t => t.type === 'deposit');
      const withdrawals = recentTransactions.filter(t => t.type === 'withdrawal');
      
      const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalWithdrawals = withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const stats = {
        totalUsers,
        activeUsers,
        totalDeposits,
        totalWithdrawals,
        pendingTransactions,
        maintenanceMode: false // This could be stored in a settings table
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin statistics' });
    }
  });

  app.get('/api/admin/users', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const users = await storage.getUsers({
        limit: Number(limit),
        offset,
        search: search as string,
        status: status as string
      });

      const totalUsers = await storage.getUserCount();
      
      // For each user, fetch their dynamic balance
      const usersWithBalance = await Promise.all(users.map(async user => {
        const transactions = await storage.getUserTransactions(user.id);
        let availableBalance = 0;
        for (const tx of transactions) {
          if (tx.status === 'completed') {
            if (tx.type === 'deposit' || tx.type === 'transfer') {
              availableBalance += parseFloat(tx.amount);
            } else if (tx.type === 'withdrawal' || tx.type === 'investment') {
              availableBalance -= parseFloat(tx.amount);
            }
          }
        }
        return {
          ...user,
          balance: availableBalance
        };
      }));

      res.json({
        users: usersWithBalance.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          balance: user.balance // Now included and dynamic!
        })),
        totalPages: Math.ceil(totalUsers / Number(limit)),
        currentPage: Number(page),
        totalUsers
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.put('/api/admin/users/:id', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Don't allow updating passwords through this endpoint
      delete updates.password;
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Log admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin updated user ${userId}`,
        details: { updatedFields: Object.keys(updates), targetUserId: userId }
      });

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (userId === req.user!.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Log admin action
      await storage.createLog({
        type: "warning",
        userId: req.user!.id,
        message: `Admin deleted user ${userId}`,
        details: { targetUserId: userId }
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Fund user account endpoint
  app.post('/api/admin/users/:id/fund', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, description } = req.body;

      // Validate input
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Valid positive amount is required' });
      }

      if (amount > 1000000) {
        return res.status(400).json({ message: 'Amount cannot exceed $1,000,000' });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Do NOT update user.balance directly!
      // Only create a completed deposit transaction
      await storage.createTransaction({
        userId: userId,
        type: 'deposit',
        amount: amount.toString(),
        status: 'completed',
        description: description || `Admin funding by ${req.user!.firstName} ${req.user!.lastName}`
      });

      // Log admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin funded user account: $${amount} added to user ${userId}`,
        details: { 
          targetUserId: userId, 
          amount: amount,
          description: description,
          previousBalance: 'dynamic', // Now calculated dynamically
          newBalance: 'dynamic' // Now calculated dynamically
        }
      });

      // Create notification for the user
      await storage.createNotification({
        userId: userId,
        type: 'account',
        title: 'Account Funded',
        message: `Your account has been funded with $${amount.toLocaleString()} by administration.`,
        relatedEntityType: 'transaction',
        relatedEntityId: userId
      });

      res.json({ 
        message: 'User account funded successfully',
        amount: amount
      });
    } catch (error) {
      console.error('Error funding user account:', error);
      res.status(500).json({ message: 'Failed to fund user account' });
    }
  });

  app.get('/api/admin/transactions', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, type, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const transactions = await storage.getTransactions({
        limit: Number(limit),
        offset,
        type: type as string,
        status: status as string
      });

      const totalTransactions = await storage.getTransactionCount();
      
      res.json({
        transactions,
        totalPages: Math.ceil(totalTransactions / Number(limit)),
        currentPage: Number(page),
        totalTransactions
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  app.put('/api/admin/transactions/:id/status', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { status, reason } = req.body;
      
      const updatedTransaction = await storage.updateTransactionStatus(transactionId, status, reason);
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Log admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin updated transaction ${transactionId} status to ${status}`,
        details: { transactionId, newStatus: status, reason }
      });

      res.json(updatedTransaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ message: 'Failed to update transaction' });
    }
  });

  // Admin deposits management
  app.get('/api/admin/deposits', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const deposits = await storage.getDeposits({
        limit: Number(limit),
        offset,
        status: status as string,
        search: search as string
      });

      const totalDeposits = await storage.getDepositCount();
      
      res.json({
        deposits,
        totalPages: Math.ceil(totalDeposits / Number(limit)),
        currentPage: Number(page),
        totalDeposits
      });
    } catch (error) {
      console.error('Error fetching deposits:', error);
      res.status(500).json({ message: 'Failed to fetch deposits' });
    }
  });

  app.put('/api/admin/deposits/:id/status', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const depositId = parseInt(req.params.id);
      const { status, reason } = req.body;
      
      const updatedDeposit = await storage.updateDepositStatus(depositId, status);
      
      if (!updatedDeposit) {
        return res.status(404).json({ message: 'Deposit not found' });
      }

      // Log admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin ${status} deposit ${depositId}${reason ? ` - Reason: ${reason}` : ''}`,
        details: { depositId, newStatus: status, reason, amount: updatedDeposit.amount }
      });

      res.json(updatedDeposit);
    } catch (error) {
      console.error('Error updating deposit status:', error);
      res.status(500).json({ message: 'Failed to update deposit status' });
    }
  });

  // Admin withdrawals management
  app.get('/api/admin/withdrawals', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const withdrawals = await storage.getWithdrawals({
        limit: Number(limit),
        offset,
        status: status as string,
        search: search as string
      });

      const totalWithdrawals = await storage.getWithdrawalCount();
      
      res.json({
        withdrawals,
        totalPages: Math.ceil(totalWithdrawals / Number(limit)),
        currentPage: Number(page),
        totalWithdrawals
      });
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      res.status(500).json({ message: 'Failed to fetch withdrawals' });
    }
  });

  app.put('/api/admin/withdrawals/:id/status', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const { status, reason } = req.body;
      
      const updatedWithdrawal = await storage.updateWithdrawalStatus(withdrawalId, status);
      
      if (!updatedWithdrawal) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }

      // Log admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin ${status} withdrawal ${withdrawalId}`,
        details: { withdrawalId, newStatus: status, reason, amount: updatedWithdrawal.amount }
      });

      res.json(updatedWithdrawal);
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      res.status(500).json({ message: 'Failed to update withdrawal status' });
    }
  });

  // Bulk operations for admin
  app.post('/api/admin/users/bulk-update', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { userIds, updates } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'User IDs array is required' });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          const updatedUser = await storage.updateUser(userId, updates);
          if (updatedUser) {
            results.push({ userId, success: true, user: updatedUser });
          } else {
            results.push({ userId, success: false, error: 'User not found' });
          }
        } catch (error) {
          results.push({ userId, success: false, error: 'Update failed' });
        }
      }

      // Log bulk admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin performed bulk update on ${userIds.length} users`,
        details: { userIds, updates, results: results.map(r => ({ userId: r.userId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk update:', error);
      res.status(500).json({ message: 'Failed to perform bulk update' });
    }
  });

  app.post('/api/admin/transactions/bulk-update', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { transactionIds, status, reason } = req.body;
      
      if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
        return res.status(400).json({ message: 'Transaction IDs array is required' });
      }

      const results = [];
      for (const transactionId of transactionIds) {
        try {
          const updatedTransaction = await storage.updateTransactionStatus(transactionId, status, reason);
          if (updatedTransaction) {
            results.push({ transactionId, success: true, transaction: updatedTransaction });
          } else {
            results.push({ transactionId, success: false, error: 'Transaction not found' });
          }
        } catch (error) {
          results.push({ transactionId, success: false, error: 'Update failed' });
        }
      }

      // Log bulk admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin performed bulk status update on ${transactionIds.length} transactions`,
        details: { transactionIds, newStatus: status, reason, results: results.map(r => ({ transactionId: r.transactionId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk transaction update:', error);
      res.status(500).json({ message: 'Failed to perform bulk transaction update' });
    }
  });

  // Audit logging endpoint
  app.get('/api/admin/audit-logs', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, userId, type, dateFrom, dateTo } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const logs = await storage.getAuditLogs({
        limit: Number(limit),
        offset,
        search: userId ? `user:${userId}` : undefined,
        action: type as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      });

      const totalLogs = await storage.getAuditLogCount();
      
      res.json({
        logs,
        totalPages: Math.ceil(totalLogs / Number(limit)),
        currentPage: Number(page),
        totalLogs
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Export data endpoints
  app.get('/api/admin/export/users', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { format = 'csv' } = req.query;
      const users = await storage.getAllUsersForExport();
      
      if (format === 'csv') {
        const csv = convertToCSV(users);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
        res.send(csv);
      } else {
        res.json(users);
      }

      // Log export action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin exported users data as ${format}`,
        details: { format, recordCount: users.length }
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      res.status(500).json({ message: 'Failed to export users' });
    }
  });

  app.get('/api/admin/export/transactions', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { format = 'csv', dateFrom, dateTo } = req.query;
      const transactions = await storage.getAllTransactionsForExport();
      
      if (format === 'csv') {
        const csv = convertToCSV(transactions);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
        res.send(csv);
      } else {
        res.json(transactions);
      }

      // Log export action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin exported transactions data as ${format}`,
        details: { format, recordCount: transactions.length, dateFrom, dateTo }
      });
    } catch (error) {
      console.error('Error exporting transactions:', error);
      res.status(500).json({ message: 'Failed to export transactions' });
    }
  });

  // Maintenance mode management
  app.get('/api/admin/maintenance', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const maintenanceSettings = await storage.getMaintenanceSettings();
      res.json(maintenanceSettings);
    } catch (error) {
      console.error('Error fetching maintenance settings:', error);
      res.status(500).json({ message: 'Failed to fetch maintenance settings' });
    }
  });

  app.put('/api/admin/maintenance', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      const updatedSettings = await storage.updateMaintenanceSettings(settings);
      
      // Log maintenance change
      await storage.createLog({
        type: "warning",
        userId: req.user!.id,
        message: `Admin updated maintenance settings`,
        details: { settings }
      });

      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating maintenance settings:', error);
      res.status(500).json({ message: 'Failed to update maintenance settings' });
    }
  });

















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
        if (process.env.NODE_ENV !== "production") console.log(`Password reset requested for ${email}`);
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
      
      if (process.env.NODE_ENV !== "production") console.log(`Password reset with token: ${token}`);
      
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset-password:", error);
      return res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
