import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./storage";
import express from 'express';
import { type User as DbUser, type Transaction, type InsertUser } from "@shared/schema";
import { z } from "zod";
import { setupAuth, verifyUserEmail, resendVerificationEmail, requireEmailVerification, requireAdminRole, comparePasswords, hashPassword } from "./auth";
import { pool } from './db';
import { handleEmailChange } from './emailChangeService';
import { sendWelcomeEmail, sendPasswordResetEmail, sendDepositRequestEmail, sendDepositApprovedEmail, sendWithdrawalRequestEmail, sendWithdrawalApprovedEmail } from './emailManager';
import { sendTestEmail } from './emailTestingService';
import logRoutes from './logRoutes';

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
  passwordResetToken?: string | null;
  passwordResetTokenExpiry?: Date | null;
  pendingEmail?: string | null;
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

// Email sending routes
router.post('/send-welcome-email', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Create a minimal user object for the email
    const userData: User = {
      id: 0, // Not needed for email template
      email,
      username: email.split('@')[0],
      firstName: firstName || 'User',
      lastName: lastName || '',
      role: 'user',
      balance: '0',
      isVerified: true,
      isActive: true,
      password: '', // Not needed for email
      referredBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      twoFactorEnabled: false,
      twoFactorSecret: null,
      verificationToken: null,
      verificationTokenExpiry: null,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      pendingEmail: null,
      bitcoinAddress: null,
      bitcoinCashAddress: null,
      ethereumAddress: null,
      bnbAddress: null,
      usdtTrc20Address: null
    };
    
    const emailSent = await sendWelcomeEmail(userData);
    
    if (emailSent) {
      return res.status(200).json({ message: 'Welcome email sent successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to send welcome email' });
    }
  } catch (error) {
    console.error('Send welcome email error:', error);
    return res.status(500).json({ message: 'Failed to send welcome email' });
  }
});

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

// Update email route - separate from profile updates to handle verification flow
router.post('/update-email', requireEmailVerification, async (req: Request, res: Response) => {
  await handleEmailChange(req, res);
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

    // Get user's base balance from users table
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use the stored balance directly since it's already updated by transaction approval
    let availableBalance = parseFloat(user.balance) || 0;
    let pendingBalance = 0;

    // Only calculate pending amounts from transactions
    const transactions = await storage.getUserTransactions(userId);
    for (const tx of transactions) {
      if (tx.status === 'pending') {
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

// User transaction routes
router.get('/users/:userId/transactions', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = parseInt(req.params.userId, 10);
    // Users can only access their own transactions unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const transactions = await storage.getUserTransactions(userId);
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Get user transactions error:', error);
    return res.status(500).json({ message: 'Failed to get user transactions' });
  }
});

// Get transactions (for current user if no userId specified)
router.get('/transactions', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const transactions = await storage.getUserTransactions(req.user.id);
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ message: 'Failed to get transactions' });
  }
});

// Get specific transaction by ID
router.get('/transactions/:transactionId', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const transactionId = parseInt(req.params.transactionId, 10);
    const transaction = await storage.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Users can only access their own transactions unless they're admin
    if (req.user.role !== 'admin' && transaction.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    return res.status(500).json({ message: 'Failed to get transaction' });
  }
});

// Create new transaction (deposit/withdrawal)
router.post('/transactions', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { type, amount, description, cryptoType, walletAddress, transactionHash, planName } = req.body;
    
    if (!type || !amount) {
      return res.status(400).json({ message: 'Transaction type and amount are required' });
    }

    if (!['deposit', 'withdrawal', 'transfer', 'investment'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // For withdrawals, check balance and deduct immediately
    if (type === 'withdrawal') {
      if (!cryptoType || !walletAddress) {
        return res.status(400).json({ message: 'Crypto type and wallet address are required for withdrawals' });
      }

      // Check user's available balance
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const currentBalance = parseFloat(user.balance || '0');
      if (currentBalance < amountNum) {
        return res.status(400).json({ 
          message: 'Insufficient balance for withdrawal',
          availableBalance: currentBalance,
          requestedAmount: amountNum
        });
      }

      // Deduct amount from user's balance immediately
      const deductBalanceQuery = `
        UPDATE users 
        SET balance = balance - $1 
        WHERE id = $2
      `;
      await pool.query(deductBalanceQuery, [amountNum, req.user.id]);
    }

    const transactionData = {
      userId: req.user.id,
      type,
      amount: amount.toString(),
      status: 'pending' as const,
      description: description || `${type} transaction`,
      cryptoType: cryptoType || null,
      walletAddress: walletAddress || null,
      transactionHash: transactionHash || null,
      planName: planName || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const transaction = await storage.createTransaction(transactionData);
    
    if (!transaction) {
      // If transaction creation fails and it was a withdrawal, refund the balance
      if (type === 'withdrawal') {
        const refundBalanceQuery = `
          UPDATE users 
          SET balance = balance + $1 
          WHERE id = $2
        `;
        await pool.query(refundBalanceQuery, [amountNum, req.user.id]);
      }
      return res.status(500).json({ message: 'Failed to create transaction' });
    }

    // Send appropriate request email based on transaction type
    try {
      if (type === 'withdrawal') {
        const clientIp = req.ip || req.connection.remoteAddress || 'Unknown';
        await sendWithdrawalRequestEmail(req.user!, amount.toString(), clientIp);
      }
      // Note: Deposit request emails are handled in the deposit-confirmation endpoint
    } catch (emailError) {
      console.error('Failed to send transaction request email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ message: 'Failed to create transaction' });
  }
});

// Deposit confirmation endpoint
router.post('/transactions/deposit-confirmation', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { amount, cryptoType, walletAddress, transactionHash, planName } = req.body;
    
    if (!amount || !cryptoType || !walletAddress || !transactionHash) {
      return res.status(400).json({ message: 'Amount, crypto type, wallet address, and transaction hash are required' });
    }

    const transactionData = {
      userId: req.user.id,
      type: 'deposit' as const,
      amount: amount.toString(),
      status: 'pending' as const,
      description: `Crypto deposit - ${cryptoType}`,
      cryptoType,
      walletAddress,
      transactionHash,
      planName: planName || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const transaction = await storage.createTransaction(transactionData);
    
    if (!transaction) {
      return res.status(500).json({ message: 'Failed to create deposit confirmation' });
    }

    // Send deposit request email
    try {
      await sendDepositRequestEmail(req.user, amount.toString(), cryptoType, planName);
    } catch (emailError) {
      console.error('Failed to send deposit request email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      amount: parseFloat(amount),
      transactionId: transaction.id,
      message: 'Deposit confirmation submitted successfully'
    });
  } catch (error) {
    console.error('Deposit confirmation error:', error);
    return res.status(500).json({ message: 'Failed to submit deposit confirmation' });
  }
});

// Transaction stats endpoint
router.get('/transactions/stats', requireEmailVerification, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // For now, return basic mock stats
    // In a real implementation, you'd calculate these from the database
    return res.status(200).json({
      totalTransactions: 0,
      pendingTransactions: 0,
      completedTransactions: 0,
      failedTransactions: 0,
      totalVolume: "0",
      averageTransactionAmount: "0",
      transactionsByType: [
        { type: 'deposit', count: 0 },
        { type: 'withdrawal', count: 0 },
        { type: 'transfer', count: 0 },
        { type: 'investment', count: 0 }
      ],
      transactionsByStatus: [
        { status: 'pending', count: 0 },
        { status: 'completed', count: 0 },
        { status: 'rejected', count: 0 }
      ],
      transactionTrend: []
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    return res.status(500).json({ message: 'Failed to get transaction stats' });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Export the router
export default router;

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Apply the router to the app
  app.use('/api', router);
  
  // Apply logging routes
  app.use('/api', logRoutes);
  
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: global.dbConnectionIssues ? 'error' : 'connected',
      version: process.env.npm_package_version || '1.0.0'
    });
  });
  
  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    console.log('🔍 Admin stats endpoint called');
    console.log('User:', req.user?.email);
    console.log('Is admin:', req.user?.role === 'admin');
    
    try {
      // Get dashboard statistics
      const totalUsers = await storage.getUserCount();
      console.log('📊 Total users:', totalUsers);
      const activeUsers = await storage.getActiveUserCount();
      console.log('📊 Active users:', activeUsers);
      const pendingTransactions = await storage.getPendingTransactionCount();
      console.log('📊 Pending transactions:', pendingTransactions);
      
      // Get ALL transactions for proper calculations
      const allTransactions = await storage.getAllTransactions();
      console.log('Admin stats - Total transactions found:', allTransactions.length);
      console.log('Admin stats - Sample transactions:', allTransactions.slice(0, 3).map(t => ({ id: t.id, type: t.type, status: t.status, amount: t.amount })));
      
      // Calculate deposit statistics
      const allDeposits = allTransactions.filter(t => t.type === 'deposit');
      console.log('Admin stats - Deposits found:', allDeposits.length);
      console.log('Admin stats - Sample deposits:', allDeposits.slice(0, 3).map(t => ({ id: t.id, type: t.type, status: t.status, amount: t.amount })));
      const pendingDeposits = allDeposits.filter(t => t.status === 'pending');
      const approvedDeposits = allDeposits.filter(t => t.status === 'completed');
      const totalDepositsAmount = allDeposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Calculate withdrawal statistics
      const allWithdrawals = allTransactions.filter(t => t.type === 'withdrawal');
      const pendingWithdrawals = allWithdrawals.filter(t => t.status === 'pending');
      const approvedWithdrawals = allWithdrawals.filter(t => t.status === 'completed');
      const totalWithdrawalsAmount = allWithdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Calculate this month's data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthDeposits = allDeposits.filter(t => t.createdAt ? new Date(t.createdAt) >= startOfMonth : false);
      const thisMonthWithdrawals = allWithdrawals.filter(t => t.createdAt ? new Date(t.createdAt) >= startOfMonth : false);

      const stats = {
        totalUsers,
        activeUsers,
        totalDeposits: totalDepositsAmount,
        totalWithdrawals: totalWithdrawalsAmount,
        pendingTransactions,
        maintenanceMode: false,
        deposits: {
          total: totalDepositsAmount,
          pending: pendingDeposits.length,
          approved: approvedDeposits.length,
          thisMonth: thisMonthDeposits.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        },
        withdrawals: {
          total: totalWithdrawalsAmount,
          pending: pendingWithdrawals.length,
          approved: approvedWithdrawals.length,
          thisMonth: thisMonthWithdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        }
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin statistics' });
    }
  });
  
  // Admin email test endpoint
  app.post('/api/admin/test-email', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    await sendTestEmail(req, res);
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
      
      // Validate user ID
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Prevent admin from deleting themselves
      if (userId === req.user!.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      // Check if user exists before attempting to delete
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user can be safely deleted
      const deleteCheck = await storage.canUserBeDeleted(userId);
      
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete user due to database constraints' });
      }

      // Determine what actually happened and provide appropriate response
      const wasDeactivated = !deleteCheck.canDelete;
      
      // Log admin action with appropriate message
      const actionMessage = wasDeactivated
        ? `Admin deactivated user ${userId} (${userToDelete.username}) - had ${deleteCheck.associatedRecords.transactions} transactions and ${deleteCheck.associatedRecords.auditLogs} audit logs`
        : `Admin deleted user ${userId} (${userToDelete.username})`;
        
      await storage.createLog({
        type: "warning",
        userId: req.user!.id,
        message: actionMessage,
        details: { 
          targetUserId: userId,
          targetUsername: userToDelete.username,
          targetEmail: userToDelete.email,
          hadAssociatedRecords: wasDeactivated,
          associatedRecords: deleteCheck.associatedRecords
        }
      });

      // Provide appropriate response message
      const responseMessage = wasDeactivated
        ? `User account deactivated successfully (user had ${deleteCheck.associatedRecords.transactions} transactions and ${deleteCheck.associatedRecords.auditLogs} audit logs)`
        : 'User deleted successfully';

      res.json({ 
        message: responseMessage,
        action: wasDeactivated ? 'deactivated' : 'deleted',
        deletedUser: {
          id: userId,
          username: userToDelete.username,
          email: userToDelete.email
        }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Check if it's a foreign key constraint error
      if (error instanceof Error && error.message.includes('foreign key constraint')) {
        return res.status(409).json({ 
          message: 'Cannot delete user: User has associated records that prevent deletion',
          error: 'foreign_key_constraint'
        });
      }
      
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
    console.log('🔍 Admin deposits endpoint called');
    console.log('Query params:', req.query);
    
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        search,
        dateFrom,
        dateTo,
        method,
        amountMin,
        amountMax
      } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      
      // Get deposits from the transactions table
      const deposits = await storage.getDeposits({
        limit: Number(limit),
        offset,
        status: status as string,
        search: search as string,
        ...(dateFrom ? { dateFrom: dateFrom as string } : {}),
        ...(dateTo ? { dateTo: dateTo as string } : {}),
        ...(method ? { method: method as string } : {}),
        ...(amountMin ? { amountMin: parseFloat(amountMin as string) } : {}),
        ...(amountMax ? { amountMax: parseFloat(amountMax as string) } : {})
      });

      // Also get deposits from deposits_history table temporarily
      let historyDeposits = [];
      try {
        const historyQuery = `
          SELECT 
            'hist_' || id as id,
            user_id,
            amount::text as amount,
            plan_name as description,
            status,
            created_at,
            updated_at,
            payment_method as crypto_type,
            null as transaction_hash,
            null as wallet_address
          FROM deposits_history 
          WHERE status = 'pending'
          ORDER BY created_at DESC
          LIMIT $1
        `;
        const historyResult = await pool.query(historyQuery, [Number(limit)]);
        
        // Add user information to history deposits
        for (const deposit of historyResult.rows) {
          const userQuery = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [deposit.user_id]);
          deposit.user = userQuery.rows[0] || null;
        }
        
        historyDeposits = historyResult.rows;
      } catch (historyError) {
        console.log('Could not fetch from deposits_history:', historyError.message);
      }

      // Combine both sources
      const allDeposits = [...deposits, ...historyDeposits];
      const totalDeposits = await storage.getDepositCount() + historyDeposits.length;
      
      console.log(`Admin deposits query: found ${allDeposits.length} deposits, total: ${totalDeposits}`);
      
      res.json({
        deposits: allDeposits,
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
      
      // Get the deposit first to check details
      const deposit = await storage.getTransactionById(depositId);
      if (!deposit) {
        return res.status(404).json({ message: 'Deposit not found' });
      }

      // Update deposit status
      const updatedDeposit = await storage.updateTransactionStatus(depositId, status, reason);
      
      if (!updatedDeposit) {
        return res.status(404).json({ message: 'Failed to update deposit' });
      }

      // Get user details for email
      const user = await storage.getUser(deposit.userId);
      
      // Send appropriate email based on status
      try {
        if (status === 'completed' && user) {
          await sendDepositApprovedEmail(
            user, 
            deposit.amount, 
            deposit.cryptoType || 'Crypto',
            deposit.planName || undefined
          );
        }
        // Could add rejection email here if needed
      } catch (emailError) {
        console.error('Failed to send deposit status email:', emailError);
        // Don't fail the request if email fails
      }

      // Notify user about the decision
      const statusMessage = status === 'completed' ? 'approved' : 'rejected';
      await storage.createNotification({
        userId: deposit.userId,
        type: 'transaction',
        title: `Deposit ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
        message: `Your deposit of $${deposit.amount} has been ${statusMessage} by admin.${reason ? ` Reason: ${reason}` : ''}`,
        relatedEntityType: 'transaction',
        relatedEntityId: depositId
      });

      // Log admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin ${statusMessage} deposit ${depositId}${reason ? ` - Reason: ${reason}` : ''}`,
        details: { depositId, newStatus: status, reason, amount: updatedDeposit.amount }
      });

      res.json({
        success: true,
        message: `Deposit ${statusMessage} successfully`,
        deposit: updatedDeposit
      });
    } catch (error) {
      console.error('Error updating deposit status:', error);
      res.status(500).json({ message: 'Failed to update deposit status' });
    }
  });

  // Admin withdrawals management
  app.get('/api/admin/withdrawals', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      console.log('GET /api/admin/withdrawals called with query:', req.query);
      
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      console.log('Querying withdrawals with status:', status);
      
      const withdrawals = await storage.getWithdrawals({
        limit: Number(limit),
        offset,
        status: status as string,
        search: search as string
      });
      
      console.log(`Found ${withdrawals.length} withdrawals`);

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

  // Add missing bulk operations for deposits and withdrawals
  app.post('/api/admin/deposits/bulk-approve', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { depositIds } = req.body;
      
      if (!Array.isArray(depositIds) || depositIds.length === 0) {
        return res.status(400).json({ message: 'Deposit IDs array is required' });
      }

      const results = [];
      for (const depositId of depositIds) {
        try {
          if (depositId.toString().startsWith('hist_')) {
            // Handle deposits_history table
            const historyId = parseInt(depositId.replace('hist_', ''));
            
            const historyQuery = `
              SELECT * FROM deposits_history 
              WHERE id = $1 AND status = 'pending'
            `;
            const historyResult = await pool.query(historyQuery, [historyId]);
            
            if (historyResult.rows.length > 0) {
              const deposit = historyResult.rows[0];
              
              // Update status to completed (not approved)
              const updateQuery = `
                UPDATE deposits_history 
                SET status = 'completed', updated_at = NOW()
                WHERE id = $1
              `;
              await pool.query(updateQuery, [historyId]);
              
              // Store the deposit info for balance update later
              const depositInfo = {
                amount: deposit.amount,
                userId: deposit.user_id
              };
              
              // Add to pending balance updates
              pendingBalanceUpdates.push(depositInfo);
              
              results.push({ depositId, success: true, deposit });
            } else {
              results.push({ depositId, success: false, error: 'Deposit not found' });
            }
          } else {
            // Handle transactions table
            const updatedDeposit = await storage.updateTransactionStatus(parseInt(depositId), 'completed');
            if (updatedDeposit) {
              const deposit = await storage.getTransactionById(parseInt(depositId));
              
              // Store the deposit info for balance update later
              const depositInfo = {
                amount: deposit.amount,
                userId: deposit.userId
              };
              
              // Add to pending balance updates
              pendingBalanceUpdates.push(depositInfo);
              
              results.push({ depositId, success: true, deposit: updatedDeposit });
            } else {
              results.push({ depositId, success: false, error: 'Deposit not found' });
            }
          }
        } catch (error) {
          results.push({ depositId, success: false, error: 'Update failed' });
        }
      }

      // Log bulk admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin bulk approved ${depositIds.length} deposits`,
        details: { depositIds, results: results.map(r => ({ depositId: r.depositId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk deposit approval:', error);
      res.status(500).json({ message: 'Failed to perform bulk deposit approval' });
    }
  });

  app.post('/api/admin/deposits/bulk-reject', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { depositIds } = req.body;
      
      if (!Array.isArray(depositIds) || depositIds.length === 0) {
        return res.status(400).json({ message: 'Deposit IDs array is required' });
      }

      const results = [];
      for (const depositId of depositIds) {
        try {
          if (depositId.toString().startsWith('hist_')) {
            // Handle deposits_history table
            const historyId = parseInt(depositId.replace('hist_', ''));
            
            const historyQuery = `
              SELECT * FROM deposits_history 
              WHERE id = $1 AND status = 'pending'
            `;
            const historyResult = await pool.query(historyQuery, [historyId]);
            
            if (historyResult.rows.length > 0) {
              const deposit = historyResult.rows[0];
              
              // Update status to rejected
              const updateQuery = `
                UPDATE deposits_history 
                SET status = 'rejected', updated_at = NOW()
                WHERE id = $1
              `;
              await pool.query(updateQuery, [historyId]);
              
              results.push({ depositId, success: true, deposit });
            } else {
              results.push({ depositId, success: false, error: 'Deposit not found' });
            }
          } else {
            // Handle transactions table
            const updatedDeposit = await storage.updateTransactionStatus(parseInt(depositId), 'rejected');
            if (updatedDeposit) {
              results.push({ depositId, success: true, deposit: updatedDeposit });
            } else {
              results.push({ depositId, success: false, error: 'Deposit not found' });
            }
          }
        } catch (error) {
          results.push({ depositId, success: false, error: 'Update failed' });
        }
      }

      // Log bulk admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin bulk rejected ${depositIds.length} deposits`,
        details: { depositIds, results: results.map(r => ({ depositId: r.depositId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk deposit rejection:', error);
      res.status(500).json({ message: 'Failed to perform bulk deposit rejection' });
    }
  });

  app.delete('/api/admin/deposits/bulk-delete', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { depositIds } = req.body;
      
      if (!Array.isArray(depositIds) || depositIds.length === 0) {
        return res.status(400).json({ message: 'Deposit IDs array is required' });
      }

      const results = [];
      for (const depositId of depositIds) {
        try {
          const deleted = await storage.deleteTransaction(depositId);
          if (deleted) {
            results.push({ depositId, success: true });
          } else {
            results.push({ depositId, success: false, error: 'Deposit not found' });
          }
        } catch (error) {
          results.push({ depositId, success: false, error: 'Delete failed' });
        }
      }

      // Log bulk admin action
      await storage.createLog({
        type: "warning",
        userId: req.user!.id,
        message: `Admin bulk deleted ${depositIds.length} deposits`,
        details: { depositIds, results: results.map(r => ({ depositId: r.depositId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk deposit deletion:', error);
      res.status(500).json({ message: 'Failed to perform bulk deposit deletion' });
    }
  });

  app.post('/api/admin/withdrawals/bulk-approve', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { withdrawalIds } = req.body;
      
      if (!Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
        return res.status(400).json({ message: 'Withdrawal IDs array is required' });
      }

      const results = [];
      for (const withdrawalId of withdrawalIds) {
        try {
          const updated = await storage.updateTransactionStatus(parseInt(withdrawalId), 'completed');
          if (updated) {
            results.push({ withdrawalId, success: true });
          } else {
            results.push({ withdrawalId, success: false, error: 'Withdrawal not found' });
          }
        } catch (error) {
          results.push({ withdrawalId, success: false, error: 'Update failed' });
        }
      }

      // Log bulk admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin bulk approved ${withdrawalIds.length} withdrawals`,
        details: { withdrawalIds, results: results.map(r => ({ withdrawalId: r.withdrawalId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk withdrawal approval:', error);
      res.status(500).json({ message: 'Failed to perform bulk withdrawal approval' });
    }
  });

  app.post('/api/admin/withdrawals/bulk-reject', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { withdrawalIds } = req.body;
      
      if (!Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
        return res.status(400).json({ message: 'Withdrawal IDs array is required' });
      }

      const results = [];
      for (const withdrawalId of withdrawalIds) {
        try {
          // Get withdrawal details first for balance refund
          const withdrawal = await storage.getTransactionById(parseInt(withdrawalId));
          if (!withdrawal || withdrawal.type !== 'withdrawal') {
            results.push({ withdrawalId, success: false, error: 'Withdrawal not found' });
            continue;
          }

          const updated = await storage.updateTransactionStatus(parseInt(withdrawalId), 'rejected');
          if (updated) {
            // Refund the withdrawal amount back to user's balance
            const refundBalanceQuery = `
              UPDATE users 
              SET balance = balance + $1 
              WHERE id = $2
            `;
            await pool.query(refundBalanceQuery, [parseFloat(withdrawal.amount), withdrawal.userId]);

            results.push({ withdrawalId, success: true });
          } else {
            results.push({ withdrawalId, success: false, error: 'Withdrawal not found' });
          }
        } catch (error) {
          results.push({ withdrawalId, success: false, error: 'Update failed' });
        }
      }

      // Log bulk admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin bulk rejected ${withdrawalIds.length} withdrawals`,
        details: { withdrawalIds, results: results.map(r => ({ withdrawalId: r.withdrawalId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk withdrawal rejection:', error);
      res.status(500).json({ message: 'Failed to perform bulk withdrawal rejection' });
    }
  });

  // Simple deposit approval
  app.post('/api/admin/deposits/:id/approve', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      
      // Check if this is a deposits_history entry (starts with "hist_")
      if (idParam.startsWith('hist_')) {
        const historyId = parseInt(idParam.replace('hist_', ''));
        
        // Get deposit from deposits_history table
        const historyQuery = `
          SELECT * FROM deposits_history 
          WHERE id = $1 AND status = 'pending'
        `;
        const historyResult = await pool.query(historyQuery, [historyId]);
        
        if (historyResult.rows.length === 0) {
          return res.status(404).json({ message: 'Deposit not found' });
        }
        
        const deposit = historyResult.rows[0];
        
        // Update deposits_history status to completed (not approved)
        const updateHistoryQuery = `
          UPDATE deposits_history 
          SET status = 'completed', updated_at = NOW()
          WHERE id = $1
        `;
        await pool.query(updateHistoryQuery, [historyId]);
        
        // Add to user balance
        const addBalanceQuery = `
          UPDATE users 
          SET balance = balance + $1 
          WHERE id = $2
        `;
        await pool.query(addBalanceQuery, [parseFloat(deposit.amount), deposit.user_id]);
        
        // Create notification
        await storage.createNotification({
          userId: deposit.user_id,
          type: 'transaction',
          title: 'Deposit Approved',
          message: `Your deposit of $${deposit.amount} has been approved and added to your account.`,
          relatedEntityType: 'transaction',
          relatedEntityId: historyId
        });

        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin approved deposit #${idParam} of $${deposit.amount}`,
          details: { depositId: idParam, amount: deposit.amount, userId: deposit.user_id }
        });

        res.json({ 
          success: true, 
          message: 'Deposit approved successfully',
          amount: deposit.amount
        });
      } else {
        // Handle regular transaction table entries
        const depositId = parseInt(idParam);
        
        // Get the deposit details first
        const deposit = await storage.getTransactionById(depositId);
        if (!deposit) {
          return res.status(404).json({ message: 'Deposit not found' });
        }

        // Update to completed status
        const updated = await storage.updateTransactionStatus(depositId, 'completed');
        
        if (updated) {
          // Add to user balance
          const addBalanceQuery = `
            UPDATE users 
            SET balance = balance + $1 
            WHERE id = $2
          `;
          await pool.query(addBalanceQuery, [parseFloat(deposit.amount), deposit.userId]);
          
          // Notify the user
          // Notify user via notification and email
          await Promise.all([
            storage.createNotification({
              userId: deposit.userId,
              type: 'transaction',
              title: 'Deposit Approved',
              message: `Your deposit of $${deposit.amount} has been approved and added to your account.`,
              relatedEntityType: 'transaction',
              relatedEntityId: depositId
            }),
            // Get user details for sending email
            storage.getUser(deposit.userId).then(user => {
              if (user) {
                sendDepositApprovedEmail(
                  user,
                  deposit.amount,
                  deposit.cryptoType || 'account balance',
                  deposit.planName || undefined
                ).catch(error => {
                  console.error('Failed to send deposit approved email:', error);
                  // Don't fail the request if email fails
                });
              }
            })
          ]);

          await storage.createLog({
            type: "info",
            userId: req.user!.id,
            message: `Admin approved deposit #${depositId} of $${deposit.amount}`,
            details: { depositId, amount: deposit.amount, userId: deposit.userId }
          });

          res.json({ 
            success: true, 
            message: 'Deposit approved successfully',
            amount: deposit.amount
          });
        } else {
          res.status(404).json({ message: 'Deposit not found' });
        }
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
      res.status(500).json({ message: 'Failed to approve deposit' });
    }
  });

  // Simple deposit rejection
  app.post('/api/admin/deposits/:id/reject', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const { reason } = req.body;
      
      // Check if this is a deposits_history entry (starts with "hist_")
      if (idParam.startsWith('hist_')) {
        const historyId = parseInt(idParam.replace('hist_', ''));
        
        // Get deposit from deposits_history table
        const historyQuery = `
          SELECT * FROM deposits_history 
          WHERE id = $1 AND status = 'pending'
        `;
        const historyResult = await pool.query(historyQuery, [historyId]);
        
        if (historyResult.rows.length === 0) {
          return res.status(404).json({ message: 'Deposit not found' });
        }
        
        const deposit = historyResult.rows[0];
        
        // Update deposits_history status to rejected
        const updateHistoryQuery = `
          UPDATE deposits_history 
          SET status = 'rejected', updated_at = NOW()
          WHERE id = $1
        `;
        await pool.query(updateHistoryQuery, [historyId]);
        
        // Create notification
        await storage.createNotification({
          userId: deposit.user_id,
          type: 'transaction',
          title: 'Deposit Rejected',
          message: `Your deposit of $${deposit.amount} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
          relatedEntityType: 'transaction',
          relatedEntityId: historyId
        });

        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin rejected deposit #${idParam} of $${deposit.amount}${reason ? ` - Reason: ${reason}` : ''}`,
          details: { depositId: idParam, amount: deposit.amount, userId: deposit.user_id, reason }
        });

        res.json({ 
          success: true, 
          message: 'Deposit rejected successfully',
          reason: reason
        });
      } else {
        // Handle regular transaction table entries
        const depositId = parseInt(idParam);
        
        // Get the deposit details first
        const deposit = await storage.getTransactionById(depositId);
        if (!deposit) {
          return res.status(404).json({ message: 'Deposit not found' });
        }

        // Update to rejected status
        const updated = await storage.updateTransactionStatus(depositId, 'rejected', reason);
        
        if (updated) {
          // Notify the user
          await storage.createNotification({
            userId: deposit.userId,
            type: 'transaction',
            title: 'Deposit Rejected',
            message: `Your deposit of $${deposit.amount} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
            relatedEntityType: 'transaction',
            relatedEntityId: depositId
          });

          await storage.createLog({
            type: "info",
            userId: req.user!.id,
            message: `Admin rejected deposit #${depositId} of $${deposit.amount}${reason ? ` - Reason: ${reason}` : ''}`,
            details: { depositId, amount: deposit.amount, userId: deposit.userId, reason }
          });

          res.json({ 
            success: true, 
            message: 'Deposit rejected successfully',
            reason: reason
          });
        } else {
          res.status(404).json({ message: 'Deposit not found' });
        }
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      res.status(500).json({ message: 'Failed to reject deposit' });
    }
  });

  // Individual Withdrawal Actions
  app.post('/api/admin/withdrawals/:id/approve', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get the withdrawal details first
      const withdrawal = await storage.getTransactionById(parseInt(id));
      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }
      
      const updated = await storage.updateTransactionStatus(parseInt(id), 'completed');
      
      if (updated) {
        // Get user details for email
        const user = await storage.getUser(withdrawal.userId);
        
        // Send withdrawal approved email
        try {
          if (user) {
            await sendWithdrawalApprovedEmail(
              user, 
              withdrawal.amount, 
              withdrawal.walletAddress || 'Your crypto account'
            );
          }
        } catch (emailError) {
          console.error('Failed to send withdrawal approved email:', emailError);
          // Don't fail the request if email fails
        }
        
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin approved withdrawal #${id}`,
          details: { withdrawalId: id }
        });
        res.json({ success: true, message: 'Withdrawal approved successfully' });
      } else {
        res.status(404).json({ message: 'Withdrawal not found' });
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      res.status(500).json({ message: 'Failed to approve withdrawal' });
    }
  });

  app.post('/api/admin/withdrawals/:id/reject', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // Get the withdrawal details first
      const withdrawal = await storage.getTransactionById(parseInt(id));
      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal not found' });
      }

      // Validate that it's actually a withdrawal
      if (withdrawal.type !== 'withdrawal') {
        return res.status(400).json({ message: 'Transaction is not a withdrawal' });
      }

      const updated = await storage.updateTransactionStatus(parseInt(id), 'rejected', reason);
      
      if (updated) {
        // Refund the withdrawal amount back to user's balance
        const refundBalanceQuery = `
          UPDATE users 
          SET balance = balance + $1 
          WHERE id = $2
        `;
        await pool.query(refundBalanceQuery, [parseFloat(withdrawal.amount), withdrawal.userId]);

        // Notify the user
        await storage.createNotification({
          userId: withdrawal.userId,
          type: 'transaction',
          title: 'Withdrawal Rejected',
          message: `Your withdrawal of $${withdrawal.amount} has been rejected and refunded to your account.${reason ? ` Reason: ${reason}` : ''}`,
          relatedEntityType: 'transaction',
          relatedEntityId: parseInt(id)
        });

        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin rejected withdrawal #${id} of $${withdrawal.amount}${reason ? ` - Reason: ${reason}` : ''}`,
          details: { withdrawalId: id, amount: withdrawal.amount, userId: withdrawal.userId, reason }
        });

        res.json({ 
          success: true, 
          message: 'Withdrawal rejected and amount refunded successfully',
          reason: reason
        });
      } else {
        res.status(404).json({ message: 'Withdrawal not found' });
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      res.status(500).json({ message: 'Failed to reject withdrawal' });
    }
  });

  // Individual Delete Actions
  app.delete('/api/admin/deposits/:id', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const depositId = req.params.id;
      
      // Check if this is from deposits_history (prefixed with 'hist_')
      if (depositId.startsWith('hist_')) {
        const actualId = parseInt(depositId.replace('hist_', ''));
        
        // Delete from deposits_history table
        const deleteQuery = `DELETE FROM deposits_history WHERE id = $1 RETURNING *`;
        const result = await pool.query(deleteQuery, [actualId]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Deposit not found in history' });
        }
        
        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: `Admin deleted deposit #${actualId} from history`,
          details: { depositId: actualId, source: 'deposits_history' }
        });
        
        res.json({ success: true, message: 'Deposit deleted successfully' });
      } else {
        // Handle regular transactions table deposits
        const numericId = parseInt(depositId);
        const deleted = await storage.deleteTransaction(numericId);
        
        if (deleted) {
          await storage.createLog({
            type: "warning",
            userId: req.user!.id,
            message: `Admin deleted deposit #${numericId}`,
            details: { depositId: numericId, source: 'transactions' }
          });
          res.json({ success: true, message: 'Deposit deleted successfully' });
        } else {
          res.status(404).json({ message: 'Deposit not found' });
        }
      }
    } catch (error) {
      console.error('Error deleting deposit:', error);
      res.status(500).json({ message: 'Failed to delete deposit' });
    }
  });

  app.delete('/api/admin/withdrawals/:id', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteTransaction(parseInt(id));
      
      if (deleted) {
        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: `Admin deleted withdrawal #${id}`,
          details: { withdrawalId: id }
        });
        res.json({ success: true, message: 'Withdrawal deleted successfully' });
      } else {
        res.status(404).json({ message: 'Withdrawal not found' });
      }
    } catch (error) {
      console.error('Error deleting withdrawal:', error);
      res.status(500).json({ message: 'Failed to delete withdrawal' });
    }
  });

  // Bulk Delete Withdrawals
  app.delete('/api/admin/withdrawals/bulk-delete', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Withdrawal IDs array is required' });
      }

      const results = [];
      for (const id of ids) {
        try {
          const deleted = await storage.deleteTransaction(parseInt(id));
          if (deleted) {
            results.push({ withdrawalId: id, success: true });
          } else {
            results.push({ withdrawalId: id, success: false, error: 'Deletion failed' });
          }
        } catch (error) {
          results.push({ withdrawalId: id, success: false, error: 'Deletion failed' });
        }
      }

      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin bulk deleted ${ids.length} withdrawals`,
        details: { withdrawalIds: ids, results: results.map(r => ({ withdrawalId: r.withdrawalId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk withdrawal deletion:', error);
      res.status(500).json({ message: 'Failed to perform bulk withdrawal deletion' });
    }
  });

  app.delete('/api/admin/users/bulk-delete', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'User IDs array is required' });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          // Prevent admin from deleting themselves
          if (userId === req.user!.id) {
            results.push({ userId, success: false, error: 'Cannot delete your own account' });
            continue;
          }

          const deleted = await storage.deleteUser(userId);
          if (deleted) {
            results.push({ userId, success: true });
          } else {
            results.push({ userId, success: false, error: 'User not found' });
          }
        } catch (error) {
          results.push({ userId, success: false, error: 'Delete failed' });
        }
      }

      // Log bulk admin action
      await storage.createLog({
        type: "warning",
        userId: req.user!.id,
        message: `Admin bulk deleted ${userIds.length} users`,
        details: { userIds, results: results.map(r => ({ userId: r.userId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk user deletion:', error);
      res.status(500).json({ message: 'Failed to perform bulk user deletion' });
    }
  });

  // Cleanup deleted users endpoint
  app.post('/api/admin/users/cleanup-deleted', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const result = await storage.cleanupDeletedUsers();
      
      // Log the cleanup action
      await storage.createLog({
        type: "warning",
        userId: req.user!.id,
        message: `Admin cleaned up deleted users: ${result.deletedCount} users permanently removed`,
        details: { action: "cleanup_deleted_users", result }
      });

      res.json(result);
    } catch (error) {
      console.error('Error cleaning up deleted users:', error);
      res.status(500).json({ success: false, message: 'Failed to cleanup deleted users' });
    }
  });

  app.post('/api/admin/users/bulk-approve', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'User IDs array is required' });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          const updatedUser = await storage.updateUser(userId, { isVerified: true, isActive: true });
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
        message: `Admin bulk approved ${userIds.length} users`,
        details: { userIds, results: results.map(r => ({ userId: r.userId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk user approval:', error);
      res.status(500).json({ message: 'Failed to perform bulk user approval' });
    }
  });

  app.post('/api/admin/users/bulk-suspend', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'User IDs array is required' });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          // Prevent admin from suspending themselves
          if (userId === req.user!.id) {
            results.push({ userId, success: false, error: 'Cannot suspend your own account' });
            continue;
          }

          const updatedUser = await storage.updateUser(userId, { isActive: false });
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
        type: "warning",
        userId: req.user!.id,
        message: `Admin bulk suspended ${userIds.length} users`,
        details: { userIds, results: results.map(r => ({ userId: r.userId, success: r.success })) }
      });

      res.json({ results });
    } catch (error) {
      console.error('Error performing bulk user suspension:', error);
      res.status(500).json({ message: 'Failed to perform bulk user suspension' });
    }
  });

  // Add admin quick actions
  app.post('/api/admin/process-pending', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      // Get all pending transactions
      const pendingTransactions = await storage.getTransactions({
        status: 'pending',
        limit: 100,
        offset: 0
      });

      let processedCount = 0;
      const results = [];

      for (const transaction of pendingTransactions) {
        try {
          // Auto-approve smaller deposits (under $1000) as an example
          if (transaction.type === 'deposit' && parseFloat(transaction.amount) < 1000) {
            await storage.updateTransactionStatus(transaction.id, 'completed', 'Auto-approved by system');
            processedCount++;
            results.push({ id: transaction.id, action: 'approved', amount: transaction.amount });
          }
        } catch (error) {
          console.error(`Error processing transaction ${transaction.id}:`, error);
          results.push({ id: transaction.id, action: 'error', error: (error as Error).message });
        }
      }

      // Log admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin processed ${processedCount} pending transactions`,
        details: { processedCount, results }
      });

      res.json({ 
        message: `Processed ${processedCount} pending transactions`,
        processedCount,
        results
      });
    } catch (error) {
      console.error('Error processing pending transactions:', error);
      res.status(500).json({ message: 'Failed to process pending transactions' });
    }
  });

  app.post('/api/admin/generate-report', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { type, filters = {} } = req.body;

      let reportData;
      let reportName;

      switch (type) {
        case 'users':
          reportData = await storage.getAllUsersForExport();
          reportName = 'Users Report';
          break;
        case 'transactions':
          reportData = await storage.getAllTransactionsForExport();
          reportName = 'Transactions Report';
          break;
        case 'deposits':
          reportData = await storage.getDeposits({ limit: 10000, offset: 0 });
          reportName = 'Deposits Report';
          break;
        case 'withdrawals':
          reportData = await storage.getWithdrawals({ limit: 10000, offset: 0 });
          reportName = 'Withdrawals Report';
          break;
        default:
          return res.status(400).json({ message: 'Invalid report type' });
      }

      // Log admin action
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin generated ${reportName}`,
        details: { type, filters, recordCount: reportData.length }
      });

      res.json({
        message: `${reportName} generated successfully`,
        reportName,
        recordCount: reportData.length,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  // Audit logging endpoint - Updated to use new audit_logs table
  app.get('/api/admin/audit-logs', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, userId, type, dateFrom, dateTo, severity } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      // Build query conditions
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (userId) {
        whereConditions.push(`al.user_id = $${paramIndex}`);
        queryParams.push(Number(userId));
        paramIndex++;
      }

      if (type) {
        whereConditions.push(`al.action = $${paramIndex}`);
        queryParams.push(type);
        paramIndex++;
      }

      if (severity) {
        whereConditions.push(`al.severity = $${paramIndex}`);
        queryParams.push(severity);
        paramIndex++;
      }

      if (dateFrom) {
        whereConditions.push(`al.created_at >= $${paramIndex}`);
        queryParams.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        whereConditions.push(`al.created_at <= $${paramIndex}`);
        queryParams.push(dateTo);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get logs with user information
      const logsQuery = `
        SELECT 
          al.id,
          al.action as type,
          al.description as message,
          al.details,
          al.user_id as userId,
          al.created_at as createdAt,
          al.ip_address as ipAddress,
          al.user_agent as userAgent,
          al.location,
          al.severity,
          u.username,
          u.email,
          u.first_name,
          u.last_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(Number(limit), offset);

      const logsResult = await pool.query(logsQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
      const totalLogs = parseInt(countResult.rows[0].total);

      // Format the logs
      const logs = logsResult.rows.map(row => ({
        id: row.id,
        type: row.type,
        message: row.message,
        details: row.details,
        userId: row.userid,
        createdAt: row.createdat,
        ipAddress: row.ipaddress,
        userAgent: row.useragent,
        location: row.location,
        severity: row.severity,
        user: row.userid ? {
          id: row.userid,
          username: row.username,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name
        } : null
      }));
      
      res.json({
        logs,
        totalPages: Math.ceil(totalLogs / Number(limit)),
        currentPage: Number(page),
        totalLogs
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      
      // Fallback to storage layer if audit_logs table doesn't exist
      if (error.message?.includes('relation "audit_logs" does not exist')) {
        try {
          const logs = await storage.getAuditLogs({
            limit: Number(limit),
            offset: (Number(page) - 1) * Number(limit),
            ...(userId ? { search: `user:${userId}` } : {}),
            ...(type ? { action: type as string } : {}),
            ...(dateFrom ? { dateFrom: dateFrom as string } : {}),
            ...(dateTo ? { dateTo: dateTo as string } : {})
          });

          const totalLogs = await storage.getAuditLogCount();
          
          return res.json({
            logs,
            totalPages: Math.ceil(totalLogs / Number(limit)),
            currentPage: Number(page),
            totalLogs
          });
        } catch (fallbackError) {
          console.error('Fallback audit logs error:', fallbackError);
        }
      }
      
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Admin endpoint to view all deposits history
  app.get('/api/admin/deposits-history', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, userId, status, planType, dateFrom, dateTo } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      // Build query conditions
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (userId) {
        whereConditions.push(`dh.user_id = $${paramIndex}`);
        queryParams.push(Number(userId));
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`dh.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (planType) {
        whereConditions.push(`dh.plan_name ILIKE $${paramIndex}`);
        queryParams.push(`%${planType}%`);
        paramIndex++;
      }

      if (dateFrom) {
        whereConditions.push(`dh.created_at >= $${paramIndex}`);
        queryParams.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        whereConditions.push(`dh.created_at <= $${paramIndex}`);
        queryParams.push(dateTo);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get deposits with user information
      const depositsQuery = `
        SELECT 
          dh.id,
          dh.user_id,
          dh.amount,
          dh.plan_name,
          dh.payment_method,
          dh.status,
          dh.daily_return_rate,
          dh.duration_days,
          dh.total_return,
          dh.earned_amount,
          dh.remaining_days,
          dh.start_date,
          dh.end_date,
          dh.created_at,
          dh.updated_at,
          u.username,
          u.email,
          u.first_name,
          u.last_name
        FROM deposits_history dh
        LEFT JOIN users u ON dh.user_id = u.id
        ${whereClause}
        ORDER BY dh.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(Number(limit), offset);

      const depositsResult = await pool.query(depositsQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM deposits_history dh
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
      const totalDeposits = parseInt(countResult.rows[0].total);

      // Format the deposits
      const deposits = depositsResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        amount: parseFloat(row.amount),
        planName: row.plan_name,
        paymentMethod: row.payment_method,
        status: row.status,
        dailyReturnRate: parseFloat(row.daily_return_rate) || 0,
        durationDays: row.duration_days,
        totalReturn: parseFloat(row.total_return) || 0,
        earnedAmount: parseFloat(row.earned_amount) || 0,
        remainingDays: row.remaining_days,
        startDate: row.start_date,
        endDate: row.end_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          username: row.username,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name
        }
      }));
      
      res.json({
        deposits,
        totalPages: Math.ceil(totalDeposits / Number(limit)),
        currentPage: Number(page),
        totalDeposits
      });
    } catch (error) {
      console.error('Error fetching deposits history:', error);
      res.status(500).json({ message: 'Failed to fetch deposits history' });
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

  // Admin system settings management
  app.get('/api/admin/settings', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSystemSettings();
      if (!settings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      res.json(settings);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(500).json({ message: 'Failed to fetch system settings' });
    }
  });

  app.put('/api/admin/settings', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      const updatedSettings = await storage.updateSystemSettings(settings);
      // Log settings change
      await storage.createLog({
        type: "warning",
        userId: req.user!.id,
        message: `Admin updated system settings`,
        details: { settings }
      });
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating system settings:', error);
      res.status(500).json({ message: 'Failed to update system settings' });
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

  // Add deposit endpoint
  app.post("/api/transactions/deposit", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { 
        amount, 
        method, 
        currency, 
        plan, 
        planName, 
        planDuration, 
        dailyProfit, 
        totalReturn 
      } = req.body;

      // Validate input
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Valid positive amount is required' });
      }

      if (amount > 1000000) {
        return res.status(400).json({ message: 'Amount cannot exceed $1,000,000' });
      }

      // Build description with plan details for admin visibility
      let description = '';
      if (method === 'balance') {
        description = `Investment via account balance - ${planName || 'Plan'} (${planDuration || 'Duration not specified'})`;
        if (dailyProfit) {
          description += ` - Daily Profit: $${dailyProfit.toFixed(2)}`;
        }
        if (totalReturn) {
          description += ` - Total Return: $${totalReturn.toFixed(2)}`;
        }
      } else {
        description = `Deposit via ${method || 'bank_transfer'} - ${planName || 'Plan'} (${planDuration || 'Duration not specified'})`;
        if (dailyProfit) {
          description += ` - Expected Daily: $${dailyProfit.toFixed(2)}`;
        }
        if (totalReturn) {
          description += ` - Expected Total: $${totalReturn.toFixed(2)}`;
        }
      }

      // Create transaction with plan details
      const transaction = await storage.createTransaction({
        userId: userId,
        type: 'deposit', // Always use 'deposit' so it shows in admin panel
        amount: amount.toString(),
        status: method === 'balance' ? 'completed' : 'pending',
        description: description,
        planName: planName || null,
        cryptoType: method !== 'balance' ? method : null,
        walletAddress: null, // This will be filled when user provides proof
        transactionHash: null // This will be filled when user provides proof
      });

      // Create notification for the user
      const notificationTitle = method === 'balance' ? 'Investment Successful' : 'Deposit Initiated';
      const notificationMessage = method === 'balance' 
        ? `Your investment of $${amount.toLocaleString()} has been successfully processed from your account balance for ${planName}.`
        : `Your deposit of $${amount.toLocaleString()} has been initiated for ${planName} and is pending confirmation.`;

      await storage.createNotification({
        userId: userId,
        type: 'transaction',
        title: notificationTitle,
        message: notificationMessage,
        relatedEntityType: 'transaction',
        relatedEntityId: transaction.id
      });

      // Log the deposit for audit trail
      await storage.createLog({
        type: 'audit',
        message: method === 'balance' 
          ? `User invested $${amount} using account balance for ${planName}`
          : `User initiated deposit of $${amount} via ${method} for ${planName}`,
        details: {
          userId,
          amount,
          method,
          plan,
          planName,
          dailyProfit,
          totalReturn,
          transactionId: transaction.id
        },
        userId: userId
      });

      res.status(200).json({
        success: true,
        amount: amount,
        transactionId: transaction.id,
        planName: planName,
        expectedReturn: totalReturn
      });
    } catch (error) {
      console.error('Error processing deposit:', error);
      res.status(500).json({ message: 'Failed to process deposit' });
    }
  });

  // Simple deposit confirmation endpoint
  app.post("/api/transactions/deposit-confirmation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { amount, transactionHash } = req.body;

      // Simple validation
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Valid positive amount is required' });
      }

      if (!transactionHash || transactionHash.trim().length < 10) {
        return res.status(400).json({ message: 'Valid transaction hash is required' });
      }

      // Create simple pending deposit
      const transaction = await storage.createTransaction({
        userId: userId,
        type: 'deposit',
        amount: amount.toString(),
        status: 'pending',
        description: `Deposit - Hash: ${transactionHash.trim()}`,
        transactionHash: transactionHash.trim()
      });

      // Simple notification to user
      await storage.createNotification({
        userId: userId,
        type: 'transaction',
        title: 'Deposit Submitted',
        message: `Your deposit of $${amount.toLocaleString()} has been submitted for admin review.`,
        relatedEntityType: 'transaction',
        relatedEntityId: transaction.id
      });

      res.status(200).json({
        success: true,
        message: 'Deposit submitted successfully. Please wait for admin approval.',
        transactionId: transaction.id
      });
    } catch (error) {
      console.error('Error processing deposit confirmation:', error);
      res.status(500).json({ message: 'Failed to process deposit confirmation' });
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
  
  // Admin password update route
  app.post('/api/admin/update-password', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      // Validate required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Current password, new password, and confirm password are required' });
      }
      
      // Check if new password matches confirmation
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New password and confirm password do not match' });
      }
      
      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long' });
      }
      
      // Check for password complexity (at least one number, one letter)
      const hasNumber = /\d/.test(newPassword);
      const hasLetter = /[a-zA-Z]/.test(newPassword);
      if (!hasNumber || !hasLetter) {
        return res.status(400).json({ message: 'New password must contain at least one letter and one number' });
      }
      
      // Get the current logged-in admin user
      const currentUserId = req.user!.id;
      const currentUser = await storage.getUser(currentUserId);
      
      if (!currentUser) {
        return res.status(404).json({ message: 'Current user not found' });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, currentUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      const updatedUser = await storage.updateUser(currentUserId, {
        password: hashedPassword
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update password in database' });
      }
      
      // Log the password change
      await storage.createLog({
        type: "warning",
        userId: currentUserId,
        message: `Admin user ${currentUser.email} changed their password`,
        details: { 
          userId: currentUserId,
          email: currentUser.email,
          timestamp: new Date().toISOString()
        }
      });
      
      return res.status(200).json({ 
        message: 'Password updated successfully',
        success: true
      });
    } catch (error) {
      console.error('Error updating admin password:', error);
      return res.status(500).json({ message: 'Failed to update password. Please try again.' });
    }
  });

  // Admin Settings endpoints
  app.get('/api/admin/settings', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      // Return default settings for now - can be expanded to read from database
      const settings = {
        siteName: 'AxixFinance',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@axixfinance.com',
        maxDepositAmount: 10000,
        minDepositAmount: 100,
        defaultDepositFee: 0.02,
        defaultWithdrawalFee: 0.03,
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotifications: true,
        smsNotifications: false,
        twoFactorRequired: false,
        sessionTimeout: 30
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.put('/api/admin/settings', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      
      // Validate required fields
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ message: 'Invalid settings data' });
      }
      
      // For now, just return success - can be expanded to save to database
      console.log('Admin settings updated:', settings);
      
      // Log the settings change
      await storage.createLog({
        type: "info",
        userId: req.user!.id,
        message: `Admin updated system settings`,
        details: { updatedSettings: Object.keys(settings) }
      });
      
      res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
      console.error('Error updating admin settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  // Admin Maintenance endpoints
  app.get('/api/admin/maintenance', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const maintenance = {
        enabled: false,
        message: 'The system is currently under maintenance. Please try again later.',
        scheduledStart: null,
        scheduledEnd: null,
        allowAdminAccess: true,
        maintenanceType: 'system',
        affectedServices: []
      };
      
      res.json(maintenance);
    } catch (error) {
      console.error('Error fetching maintenance settings:', error);
      res.status(500).json({ message: 'Failed to fetch maintenance settings' });
    }
  });

  app.put('/api/admin/maintenance', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const maintenance = req.body;
      
      // Validate required fields
      if (!maintenance || typeof maintenance !== 'object') {
        return res.status(400).json({ message: 'Invalid maintenance data' });
      }
      
      // For now, just return success - can be expanded to save to database
      console.log('Maintenance settings updated:', maintenance);
      
      // Log the maintenance change
      await storage.createLog({
        type: maintenance.enabled ? "warning" : "info",
        userId: req.user!.id,
        message: `Admin ${maintenance.enabled ? 'enabled' : 'disabled'} maintenance mode`,
        details: { maintenanceSettings: maintenance }
      });
      
      res.json({ message: 'Maintenance settings updated successfully', maintenance });
    } catch (error) {
      console.error('Error updating maintenance settings:', error);
      res.status(500).json({ message: 'Failed to update maintenance settings' });
    }
  });

  // Visitor tracking routes
  
  // Store for tracking active visitors (in production, use Redis or database)
  const activeVisitors = new Map<string, {
    id: string;
    ipAddress: string;
    userAgent: string;
    country: string;
    city: string;
    region: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
    currentPage: string;
    entryPage: string;
    sessionDuration: number;
    pageViews: number;
    isActive: boolean;
    lastActivity: Date;
    joinedAt: Date;
  }>();

  // Helper function to detect device type from user agent
  function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    const ua = userAgent.toLowerCase();
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
    return 'desktop';
  }

  // Helper function to get browser from user agent
  function getBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  // Helper function to get OS from user agent
  function getOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios')) return 'iOS';
    return 'Unknown';
  }

  // Get client IP address
  function getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string) || 
           (req.headers['x-real-ip'] as string) || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
  }

  // Initialize visitor session
  app.post('/api/visitors/session', async (req: Request, res: Response) => {
    try {
      const visitorId = req.sessionID || `visitor_${Date.now()}_${Math.random()}`;
      const ip = getClientIP(req);
      const userAgent = req.headers['user-agent'] || '';
      
      // Mock location data (in production, use a GeoIP service)
      const locationData = {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown'
      };

      const visitor = {
        id: visitorId,
        ipAddress: ip,
        userAgent,
        country: locationData.country,
        city: locationData.city,
        region: locationData.region,
        deviceType: getDeviceType(userAgent),
        browser: getBrowser(userAgent),
        os: getOS(userAgent),
        currentPage: '/',
        entryPage: '/',
        sessionDuration: 0,
        pageViews: 0,
        isActive: true,
        lastActivity: new Date(),
        joinedAt: new Date()
      };

      activeVisitors.set(visitorId, visitor);
      
      res.json({ success: true, visitorId });
    } catch (error) {
      console.error('Error initializing visitor session:', error);
      res.status(500).json({ message: 'Failed to initialize session' });
    }
  });

  // Track page view
  app.post('/api/visitors/track', async (req: Request, res: Response) => {
    try {
      const visitorId = req.sessionID || `visitor_${Date.now()}_${Math.random()}`;
      const { page } = req.body;
      
      const visitor = activeVisitors.get(visitorId);
      if (visitor) {
        visitor.currentPage = page;
        visitor.pageViews += 1;
        visitor.lastActivity = new Date();
        visitor.sessionDuration = Math.floor((Date.now() - visitor.joinedAt.getTime()) / 1000);
        visitor.isActive = true;
        
        activeVisitors.set(visitorId, visitor);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking page view:', error);
      res.status(500).json({ message: 'Failed to track page view' });
    }
  });

  // Update visitor activity
  app.put('/api/visitors/activity', async (req: Request, res: Response) => {
    try {
      const visitorId = req.sessionID || '';
      
      const visitor = activeVisitors.get(visitorId);
      if (visitor) {
        visitor.lastActivity = new Date();
        visitor.sessionDuration = Math.floor((Date.now() - visitor.joinedAt.getTime()) / 1000);
        visitor.isActive = true;
        
        activeVisitors.set(visitorId, visitor);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating visitor activity:', error);
      res.status(500).json({ message: 'Failed to update activity' });
    }
  });

  // End visitor session
  app.delete('/api/visitors/session', async (req: Request, res: Response) => {
    try {
      const visitorId = req.sessionID || '';
      
      const visitor = activeVisitors.get(visitorId);
      if (visitor) {
        visitor.isActive = false;
        activeVisitors.set(visitorId, visitor);
        
        // Remove inactive visitors after 5 minutes
        setTimeout(() => {
          activeVisitors.delete(visitorId);
        }, 5 * 60 * 1000);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error ending visitor session:', error);
      res.status(500).json({ message: 'Failed to end session' });
    }
  });

  // Admin: Get active visitors
  app.get('/api/admin/visitors/active', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      // Filter for active visitors (active in last 5 minutes)
      const activeVisitorsList = Array.from(activeVisitors.values())
        .filter(visitor => visitor.lastActivity > fiveMinutesAgo)
        .map(visitor => ({
          ...visitor,
          sessionDuration: Math.floor((now.getTime() - visitor.joinedAt.getTime()) / 1000)
        }));
      
      res.json(activeVisitorsList);
    } catch (error) {
      console.error('Error fetching active visitors:', error);
      res.status(500).json({ message: 'Failed to fetch active visitors' });
    }
  });

  // Admin: Get visitor statistics
  app.get('/api/admin/visitors/stats', isAuthenticated, requireAdminRole, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const allVisitors = Array.from(activeVisitors.values());
      const activeVisitorsList = allVisitors.filter(visitor => visitor.lastActivity > fiveMinutesAgo);
      const todayVisitors = allVisitors.filter(visitor => visitor.joinedAt > todayStart);
      
      // Calculate top countries
      const countryCount = new Map<string, number>();
      allVisitors.forEach(visitor => {
        countryCount.set(visitor.country, (countryCount.get(visitor.country) || 0) + 1);
      });
      const topCountries = Array.from(countryCount.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate top pages
      const pageCount = new Map<string, number>();
      allVisitors.forEach(visitor => {
        pageCount.set(visitor.currentPage, (pageCount.get(visitor.currentPage) || 0) + 1);
      });
      const topPages = Array.from(pageCount.entries())
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
      
      // Calculate device breakdown
      const deviceCount = new Map<string, number>();
      allVisitors.forEach(visitor => {
        const device = visitor.deviceType.charAt(0).toUpperCase() + visitor.deviceType.slice(1);
        deviceCount.set(device, (deviceCount.get(device) || 0) + 1);
      });
      const deviceBreakdown = Array.from(deviceCount.entries())
        .map(([device, count]) => ({ device, count }));
      
      // Calculate average session duration
      const totalDuration = allVisitors.reduce((sum, visitor) => sum + visitor.sessionDuration, 0);
      const avgSessionDuration = allVisitors.length > 0 ? Math.floor(totalDuration / allVisitors.length) : 0;
      
      const stats = {
        totalVisitors: allVisitors.length,
        activeVisitors: activeVisitorsList.length,
        todayVisitors: todayVisitors.length,
        avgSessionDuration,
        topCountries,
        topPages,
        deviceBreakdown
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
      res.status(500).json({ message: 'Failed to fetch visitor statistics' });
    }
  });

  // Deposits History API
  router.get('/api/users/:userId/deposits-history', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user;

      // Check if user can access this data
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const query = `
        SELECT 
          dh.id,
          dh.amount,
          dh.plan_name as plan,
          dh.payment_method as method,
          dh.status,
          dh.daily_return_rate as dailyReturn,
          dh.duration_days as duration,
          dh.total_return as totalReturn,
          dh.earned_amount as earnedAmount,
          dh.remaining_days as remainingDays,
          dh.start_date as startDate,
          dh.end_date as endDate,
          dh.created_at as createdAt,
          dh.payment_details
        FROM deposits_history dh
        WHERE dh.user_id = $1
        ORDER BY dh.created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      
      // Format the data
      const depositsHistory = result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount),
        dailyReturn: parseFloat(row.dailyreturn) || 0,
        totalReturn: parseFloat(row.totalreturn) || 0,
        earnedAmount: parseFloat(row.earnedamount) || 0,
        remainingDays: row.remainingdays || 0
      }));

      res.json(depositsHistory);
    } catch (error) {
      console.error('Error fetching deposits history:', error);
      res.status(500).json({ message: 'Failed to fetch deposits history' });
    }
  });

  // Withdrawal History API
  router.get('/api/users/:userId/withdrawal-history', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user;

      // Check if user can access this data
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const query = `
        SELECT 
          t.id,
          t.amount,
          t.status,
          t.type,
          t.description,
          t.method,
          t.transactionHash,
          t.createdAt,
          t.approvedAt,
          u.email as userEmail,
          u.firstname,
          u.lastname
        FROM transactions t
        JOIN users u ON t.userId = u.id
        WHERE t.userId = $1 AND t.type = 'withdrawal'
        ORDER BY t.createdAt DESC
      `;

      const result = await pool.query(query, [userId]);
      
      // Format the data
      const withdrawalHistory = result.rows.map(row => ({
        id: row.id,
        amount: parseFloat(row.amount),
        status: row.status,
        type: row.type,
        description: row.description,
        method: row.method,
        transactionHash: row.transactionhash,
        createdAt: row.createdat,
        approvedAt: row.approvedat,
        userEmail: row.useremail,
        userName: `${row.firstname} ${row.lastname}`.trim()
      }));

      res.json(withdrawalHistory);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      res.status(500).json({ message: 'Failed to fetch withdrawal history' });
    }
  });

  // Audit Logs API
  router.get('/api/users/:userId/audit-logs', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user;

      // Check if user can access this data
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const query = `
        SELECT 
          id,
          action,
          description,
          ip_address as ipAddress,
          user_agent as userAgent,
          location,
          severity,
          details,
          created_at as timestamp
        FROM audit_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const result = await pool.query(query, [userId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      
      // If table doesn't exist, log message and return empty array
      if (error.message?.includes('relation "audit_logs" does not exist')) {
        console.log('Audit logs table does not exist, logging to console instead:', {
          type: 'info',
          userId: userId,
          message: 'User accessed audit logs',
          details: { ip: req.ip }
        });
        return res.json([]);
      }
      
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Deposit confirmation endpoint
  router.post('/transactions/deposit/confirm', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const { userId, amount, selectedPlan, selectedMethod, walletAddress, transactionHash, planName, planDuration, dailyProfit, totalReturn } = req.body;
      const user = req.user;

      // Check if user can create deposits
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Validate required fields
      if (!amount || !selectedPlan || !selectedMethod) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Build description with plan details for admin visibility
      const description = `Deposit via ${selectedMethod} - ${planName || selectedPlan.toUpperCase() + ' PLAN'} (${planDuration || 'Duration not specified'})`;

      // Create transaction using the storage layer
      const transaction = await storage.createTransaction({
        userId: userId,
        type: 'deposit',
        amount: amount.toString(),
        status: 'pending', // Crypto deposits start as pending
        description: description,
        cryptoType: selectedMethod,
        walletAddress: walletAddress || null,
        transactionHash: transactionHash || null
      });

      // Create notification for the user
      await storage.createNotification({
        userId: userId,
        type: 'transaction',
        title: 'Deposit Confirmation Received',
        message: `Your deposit of $${amount} via ${selectedMethod} for ${planName || selectedPlan} has been submitted and is pending admin approval.`,
        relatedEntityType: 'transaction',
        relatedEntityId: transaction.id
      });

      // Log the deposit for audit trail
      await storage.createLog({
        type: 'audit',
        message: `User confirmed deposit of $${amount} via ${selectedMethod} for ${planName || selectedPlan}`,
        details: {
          userId,
          amount,
          selectedMethod,
          selectedPlan,
          planName,
          transactionId: transaction.id,
          walletAddress,
          transactionHash
        },
        userId: userId
      });

      res.json({ 
        message: 'Deposit confirmation submitted successfully',
        transactionId: transaction.id,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error confirming deposit:', error);
      res.status(500).json({ message: 'Failed to confirm deposit' });
    }
  });

  // Get user deposits endpoint
  router.get('/api/users/:userId/deposits', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user;

      // Check if user can access deposits
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // First try to get from deposits_history table
      try {
        const query = `
          SELECT 
            id,
            amount,
            plan_name as planName,
            payment_method as method,
            status,
            daily_return_rate as dailyReturn,
            duration_days as duration,
            earned_amount as earnedAmount,
            remaining_days as remainingDays,
            start_date as startDate,
            end_date as endDate,
            created_at as createdAt
          FROM deposits_history
          WHERE user_id = $1
          ORDER BY created_at DESC
        `;

        const result = await pool.query(query, [userId]);
        
        if (result.rows.length > 0) {
          // Format the data
          const deposits = result.rows.map(row => ({
            id: row.id,
            amount: parseFloat(row.amount),
            planName: row.planName,
            method: row.method,
            status: row.status,
            dailyReturn: parseFloat(row.dailyReturn) || 0,
            duration: row.duration,
            earnedAmount: parseFloat(row.earnedAmount) || 0,
            remainingDays: row.remainingDays || 0,
            startDate: row.startDate,
            endDate: row.endDate,
            createdAt: row.createdAt
          }));

          return res.json(deposits);
        }
      } catch (historyError) {
        console.log('Deposits history table not available, checking legacy deposits table:', historyError);
      }

      // Fallback to legacy deposits table if deposits_history doesn't exist
      try {
        const legacyQuery = `
          SELECT 
            id,
            amount,
            plan as planName,
            status,
            created_at as createdAt
          FROM deposits
          WHERE user_id = $1
          ORDER BY created_at DESC
        `;

        const legacyResult = await pool.query(legacyQuery, [userId]);
        
        const deposits = legacyResult.rows.map(row => ({
          id: row.id,
          amount: parseFloat(row.amount),
          planName: row.planName || 'Unknown Plan',
          method: 'Unknown',
          status: row.status || 'pending',
          dailyReturn: 0,
          duration: 0,
          earnedAmount: 0,
          remainingDays: 0,
          startDate: null,
          endDate: null,
          createdAt: row.createdAt
        }));

        res.json(deposits);
      } catch (legacyError) {
        console.error('Error accessing both deposits tables:', legacyError);
        res.status(500).json({ message: 'Failed to fetch deposits' });
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
      res.status(500).json({ message: 'Failed to fetch deposits' });
    }
  });

  // Get user earnings endpoint
  router.get('/api/users/:userId/earnings', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user;

      // Check if user can access earnings
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { dateFrom, dateTo, planType, limit = 20, offset = 0 } = req.query;

      // Build query conditions
      let conditions = ['user_id = $1'];
      let params: any[] = [userId];
      let paramIndex = 2;

      if (dateFrom) {
        conditions.push(`created_at >= $${paramIndex}`);
        params.push(new Date(dateFrom as string));
        paramIndex++;
      }

      if (dateTo) {
        conditions.push(`created_at <= $${paramIndex}`);
        params.push(new Date(dateTo as string));
        paramIndex++;
      }

      if (planType) {
        conditions.push(`type = $${paramIndex}`);
        params.push(planType);
        paramIndex++;
      }

      // Try to get from earnings table (if it exists)
      try {
        const query = `
          SELECT 
            id,
            user_id,
            type,
            amount,
            source,
            created_at,
            details
          FROM earnings
          WHERE ${conditions.join(' AND ')}
          ORDER BY created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(parseInt(limit as string), parseInt(offset as string));

        const result = await pool.query(query, params);
        
        // Get total count
        const countQuery = `
          SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_earnings
          FROM earnings
          WHERE ${conditions.slice(0, -2).join(' AND ')}
        `;
        
        const countResult = await pool.query(countQuery, params.slice(0, -2));
        const totalCount = parseInt(countResult.rows[0].total);
        const totalEarnings = parseFloat(countResult.rows[0].total_earnings);

        const earnings = result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          type: row.type,
          amount: parseFloat(row.amount),
          source: row.source,
          createdAt: row.created_at,
          details: row.details
        }));

        return res.json({
          earnings,
          totalEarnings,
          totalCount,
          hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string)
        });
      } catch (earningsError) {
        console.log('Earnings table not available, generating mock data:', earningsError);
      }

      // Fallback: Generate mock earnings based on deposits_history
      try {
        const depositsQuery = `
          SELECT 
            id,
            amount,
            plan_name,
            daily_return_rate,
            start_date,
            created_at
          FROM deposits_history
          WHERE user_id = $1 AND status = 'active'
          ORDER BY created_at DESC
        `;

        const depositsResult = await pool.query(depositsQuery, [userId]);
        
        // Generate mock earnings based on deposits
        const mockEarnings = [];
        let totalEarnings = 0;

        for (const deposit of depositsResult.rows) {
          const depositAmount = parseFloat(deposit.amount);
          const dailyRate = parseFloat(deposit.daily_return_rate) || 0;
          const dailyEarning = depositAmount * (dailyRate / 100);
          
          // Generate daily earnings for the last 30 days
          for (let i = 0; i < 30; i++) {
            const earningDate = new Date();
            earningDate.setDate(earningDate.getDate() - i);
            
            mockEarnings.push({
              id: mockEarnings.length + 1,
              userId: userId,
              type: 'daily_return',
              amount: dailyEarning,
              source: deposit.plan_name,
              createdAt: earningDate,
              details: { depositId: deposit.id }
            });
            
            totalEarnings += dailyEarning;
          }
        }

        // Apply filters and pagination
        let filteredEarnings = mockEarnings;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom as string);
          filteredEarnings = filteredEarnings.filter(e => new Date(e.createdAt) >= fromDate);
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo as string);
          filteredEarnings = filteredEarnings.filter(e => new Date(e.createdAt) <= toDate);
        }
        
        if (planType) {
          filteredEarnings = filteredEarnings.filter(e => e.type === planType);
        }

        const startIndex = parseInt(offset as string);
        const endIndex = startIndex + parseInt(limit as string);
        const paginatedEarnings = filteredEarnings.slice(startIndex, endIndex);

        res.json({
          earnings: paginatedEarnings,
          totalEarnings: filteredEarnings.reduce((sum, e) => sum + e.amount, 0),
          totalCount: filteredEarnings.length,
          hasMore: filteredEarnings.length > endIndex
        });
      } catch (fallbackError) {
        console.error('Error generating mock earnings:', fallbackError);
        res.json({
          earnings: [],
          totalEarnings: 0,
          totalCount: 0,
          hasMore: false
        });
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      res.status(500).json({ message: 'Failed to fetch earnings' });
    }
  });

  // Update deposits history endpoint
  router.put('/api/users/:userId/deposits/:depositId', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const depositId = parseInt(req.params.depositId);
      const user = req.user;

      // Check permissions
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { status, earnedAmount, remainingDays } = req.body;

      const updateQuery = `
        UPDATE deposits_history 
        SET 
          status = $1,
          earned_amount = $2,
          remaining_days = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND user_id = $5
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [status, earnedAmount, remainingDays, depositId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Deposit not found' });
      }

      res.json({ message: 'Deposit updated successfully', deposit: result.rows[0] });
    } catch (error) {
      console.error('Error updating deposit:', error);
      res.status(500).json({ message: 'Failed to update deposit' });
    }
  });

  // Helper function to log audit events (Enhanced to work with both systems)
  async function logAuditEvent(userId: number, action: string, description: string, req: Request, severity: string = 'low', details: any = {}) {
    try {
      // Log to new audit_logs table
      const query = `
        INSERT INTO audit_logs (user_id, action, description, ip_address, user_agent, location, severity, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      const values = [
        userId,
        action,
        description,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        'Unknown', // TODO: Add geolocation lookup
        severity,
        JSON.stringify(details)
      ];

      await pool.query(query, values);
    } catch (error) {
      // If audit logs table doesn't exist, just log to console
      console.log('Audit logs table does not exist, logging to console instead:', {
        type: severity,
        userId,
        message: description,
        details: { ip: req.ip, ...details }
      });
    }

    // Also log to storage layer for backward compatibility
    try {
      await storage.createLog({
        type: severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info',
        userId: userId,
        message: description,
        details: { ip: req.ip, action, ...details }
      });
    } catch (storageError) {
      console.warn('Failed to log to storage layer:', storageError);
    }
  }

  // Enhanced login audit logging middleware
  app.use('/api/login', async (req, res, next) => {
    // Capture the original res.json method
    const originalJson = res.json;
    
    // Override res.json to capture login results
    res.json = function(body) {
      // Log the login attempt result
      const username = req.body?.username;
      if (username && body) {
        if (res.statusCode === 200 && body.user) {
          // Successful login
          logAuditEvent(
            body.user.id,
            'login_success',
            'User successfully logged in',
            req,
            'low',
            { username, method: 'password' }
          ).catch(console.error);
        } else if (res.statusCode === 401) {
          // Failed login - try to find user ID for logging
          pool.query('SELECT id FROM users WHERE username = $1 OR email = $1', [username])
            .then(result => {
              const userId = result.rows[0]?.id;
              if (userId) {
                logAuditEvent(
                  userId,
                  'login_failed',
                  'Failed login attempt - invalid credentials',
                  req,
                  'medium',
                  { username, reason: 'invalid_credentials' }
                ).catch(console.error);
              }
            })
            .catch(() => {
              // User not found, log without user ID
              console.log('Failed login attempt for non-existent user:', username);
            });
        }
      }
      
      // Call the original json method
      return originalJson.call(this, body);
    };
    
    next();
  });

  // Helper function to log audit events
  async function logAuditEvent(userId: number, action: string, description: string, req: Request, severity: string = 'low', details: any = {}) {
    try {
      const query = `
        INSERT INTO audit_logs (user_id, action, description, ip_address, user_agent, location, severity, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      const values = [
        userId,
        action,
        description,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        'Unknown', // TODO: Add geolocation lookup
        severity,
        JSON.stringify(details)
      ];

      await pool.query(query, values);
    } catch (error) {
      // If audit logs table doesn't exist, just log to console
      console.log('Audit logs table does not exist, logging to console instead:', {
        type: severity,
        userId,
        message: description,
        details: { ip: req.ip, ...details }
      });
    }
  }

  // Update profile endpoint to include audit logging
  router.put('/api/users/:userId/profile', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user;

      // Check if user can update this profile
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { firstName, lastName, phone, address, city, state, zipCode, country, dateOfBirth } = req.body;

      const updateQuery = `
        UPDATE users 
        SET 
          first_name = $1,
          last_name = $2,
          phone = $3,
          address = $4,
          city = $5,
          state = $6,
          zip_code = $7,
          country = $8,
          date_of_birth = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `;

      const values = [firstName, lastName, phone, address, city, state, zipCode, country, dateOfBirth, userId];
      const result = await pool.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Log audit event
      await logAuditEvent(
        userId,
        'profile_updated',
        'Profile information updated',
        req,
        'low',
        { changes: Object.keys(req.body) }
      );

      res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Get user profile endpoint
  router.get('/api/users/:userId/profile', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user;

      // Check if user can access this profile
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const query = `
        SELECT 
          id,
          first_name as firstName,
          last_name as lastName,
          email,
          phone,
          address,
          city,
          state,
          zip_code as zipCode,
          country,
          date_of_birth as dateOfBirth,
          created_at as createdAt,
          updated_at as updatedAt
        FROM users
        WHERE id = $1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  // Update user security (password) endpoint
  router.put('/api/users/:userId/security', requireEmailVerification, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = req.user;

      // Check if user can update this profile
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      // Get current user password
      const userQuery = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
      if (userQuery.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const currentUser = userQuery.rows[0];

      // Verify current password
      const isValidPassword = await comparePasswords(currentPassword, currentUser.password);
      if (!isValidPassword) {
        await logAuditEvent(
          userId,
          'password_change_failed',
          'Failed password change attempt - incorrect current password',
          req,
          'medium'
        );
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      const updateQuery = `
        UPDATE users 
        SET 
          password = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await pool.query(updateQuery, [hashedNewPassword, userId]);

      // Log audit event
      await logAuditEvent(
        userId,
        'password_changed',
        'Password successfully changed',
        req,
        'medium',
        { method: 'password_form' }
      );

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: 'Failed to update password' });
    }
  });

  // Enhanced registration audit logging middleware
  app.use('/api/register', async (req, res, next) => {
    // Capture the original res.json method
    const originalJson = res.json;
    
    // Override res.json to capture registration results
    res.json = function(body) {
      // Log the registration attempt result
      const username = req.body?.username;
      const email = req.body?.email;
      
      if (body) {
        if (res.statusCode === 201 || res.statusCode === 200) {
          // Successful registration - get user ID from response or database
          if (body.user?.id) {
            logAuditEvent(
              body.user.id,
              'user_registered',
              'New user account created',
              req,
              'low',
              { username, email, registrationMethod: 'email' }
            ).catch(console.error);
          } else {
            // Try to find the newly created user
            pool.query('SELECT id FROM users WHERE username = $1 OR email = $1', [username || email])
              .then(result => {
                if (result.rows[0]?.id) {
                  logAuditEvent(
                    result.rows[0].id,
                    'user_registered',
                    'New user account created',
                    req,
                    'low',
                    { username, email, registrationMethod: 'email' }
                  ).catch(console.error);
                }
              })
              .catch(console.error);
          }
        } else if (res.statusCode >= 400) {
          // Failed registration
          console.log('Failed registration attempt:', {
            username,
            email,
            error: body.message,
            ip: req.ip
          });
        }
      }
      
      // Call the original json method
      return originalJson.call(this, body);
    };
    
    next();
  });

  // Clean up inactive visitors every 5 minutes
  setInterval(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    for (const [id, visitor] of activeVisitors) {
      if (visitor.lastActivity < fiveMinutesAgo) {
        activeVisitors.delete(id);
      }
    }
  }, 5 * 60 * 1000);
  
  const httpServer = createServer(app);
  
  return httpServer;
}
