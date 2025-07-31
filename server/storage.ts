import { eq, and, like, desc, sql, or, between, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { transactions, users, notifications, auditLogs, visitor_tracking } from "@shared/schema";

// Local type definitions (since @shared/types doesn't exist)
type Transaction = typeof transactions.$inferSelect;
type TransactionStatus = "pending" | "completed" | "rejected";
type User = typeof users.$inferSelect;
type Notification = typeof notifications.$inferSelect;
type AuditLog = typeof auditLogs.$inferSelect;
type VisitorTracking = typeof visitor_tracking.$inferSelect;

// Define types for method options
interface GetUsersOptions {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
}

async function cleanupDeletedUsers(): Promise<{ success: boolean; message: string; deletedCount: number }> {
  try {
    // Get all deactivated users (ones previously marked as deleted)
    const deletedUsers = await db.select()
      .from(users)
      .where(and(
        eq(users.isActive, false),
        like(users.email, '%@deleted.local')
      ));

    let deletedCount = 0;
    const errors: string[] = [];

    // Try to delete each user if they have no associated records
    for (const user of deletedUsers) {
      const { canDelete, associatedRecords } = await this.canUserBeDeleted(user.id);
      
      if (canDelete) {
        try {
          // If no associated records, permanently delete
          await db.delete(users).where(eq(users.id, user.id));
          deletedCount++;
        } catch (deleteError) {
          console.error(`Failed to delete user ${user.id}:`, deleteError);
          errors.push(`User ${user.id}: Deletion failed`);
        }
      } else {
        const counts = [
          `${associatedRecords.transactions} transactions`,
          `${associatedRecords.auditLogs} audit logs`,
          `${associatedRecords.logs} logs`
        ].filter(c => !c.startsWith('0')).join(', ');
        errors.push(`User ${user.id}: Has associated records (${counts})`);
      }
    }

    const message = errors.length > 0
      ? `Deleted ${deletedCount} users. Some users could not be deleted:\n${errors.join('\n')}`
      : `Successfully deleted ${deletedCount} users`;

    return {
      success: true,
      message,
      deletedCount
    };
  } catch (error) {
    console.error('Failed to cleanup deleted users:', error);
    return {
      success: false,
      message: 'Failed to cleanup deleted users: ' + (error instanceof Error ? error.message : 'Unknown error'),
      deletedCount: 0
    };
  }
}

interface GetTransactionsOptions {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface GetAuditLogsOptions {
  limit: number;
  offset: number;
  search?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Single clean DatabaseStorage class
export class DatabaseStorage {
  async cleanupDeletedUsers(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      // Get all deactivated users (ones previously marked as deleted)
      const deletedUsers = await db.select()
        .from(users)
        .where(and(
          eq(users.isActive, false),
          like(users.email, '%@deleted.local')
        ));

      let deletedCount = 0;
      const errors: string[] = [];

      // Try to delete each user if they have no associated records
      for (const user of deletedUsers) {
        const { canDelete, associatedRecords } = await this.canUserBeDeleted(user.id);
        
        if (canDelete) {
          try {
            // If no associated records, permanently delete
            await db.delete(users).where(eq(users.id, user.id));
            deletedCount++;
          } catch (deleteError) {
            console.error(`Failed to delete user ${user.id}:`, deleteError);
            errors.push(`User ${user.id}: Deletion failed`);
          }
        } else {
          const counts = [
            `${associatedRecords.transactions} transactions`,
            `${associatedRecords.auditLogs} audit logs`,
            `${associatedRecords.logs} logs`
          ].filter(c => !c.startsWith('0')).join(', ');
          errors.push(`User ${user.id}: Has associated records (${counts})`);
        }
      }

      const message = errors.length > 0
        ? `Deleted ${deletedCount} users. Some users could not be deleted:\n${errors.join('\n')}`
        : `Successfully deleted ${deletedCount} users`;

      return {
        success: true,
        message,
        deletedCount
      };
    } catch (error) {
      console.error('Failed to cleanup deleted users:', error);
      return {
        success: false,
        message: 'Failed to cleanup deleted users: ' + (error instanceof Error ? error.message : 'Unknown error'),
        deletedCount: 0
      };
    }
  }
  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    try {
      const result = await db.select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        processedBy: transactions.processedBy,
        rejectionReason: transactions.rejectionReason,
        transactionHash: transactions.transactionHash,
        cryptoType: transactions.cryptoType,
        walletAddress: transactions.walletAddress,
        planName: transactions.planName
      }).from(transactions).where(eq(transactions.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Failed to get transaction ${id}:`, error);
      return undefined;
    }
  }

  async updateTransactionStatus(id: number, status: TransactionStatus, reason?: string): Promise<Transaction | undefined> {
    try {
      const updateData: any = { 
        status, 
        updatedAt: new Date() 
      };
      
      // Add rejection reason if status is rejected and reason is provided
      if (status === 'rejected' && reason) {
        updateData.rejectionReason = reason;
      }
      
      const result = await db.update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id))
        .returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Failed to update transaction ${id}:`, error);
      return undefined;
    }
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.getTransaction(id);
  }

  async getTransactions(options: GetTransactionsOptions): Promise<Transaction[]> {
    try {
      let whereClause: any = undefined;
      const conditions: any[] = [];
      
      if (options.status) {
        conditions.push(eq(transactions.status, options.status as TransactionStatus));
      }
      
      if (options.type) {
        conditions.push(eq(transactions.type, options.type as any));
      }
      
      if (options.dateFrom && options.dateTo) {
        conditions.push(
          between(transactions.createdAt, new Date(options.dateFrom), new Date(options.dateTo))
        );
      }
      
      if (conditions.length > 0) {
        whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      }
      
      const query = whereClause 
        ? db.select({
            id: transactions.id,
            userId: transactions.userId,
            type: transactions.type,
            amount: transactions.amount,
            description: transactions.description,
            status: transactions.status,
            createdAt: transactions.createdAt,
            updatedAt: transactions.updatedAt,
            processedBy: transactions.processedBy,
            rejectionReason: transactions.rejectionReason,
            transactionHash: transactions.transactionHash,
            cryptoType: transactions.cryptoType,
            walletAddress: transactions.walletAddress
            // Excluding new columns that don't exist yet: planName, planDuration, dailyProfit, totalReturn, expectedCompletionDate
          }).from(transactions).where(whereClause)
        : db.select({
            id: transactions.id,
            userId: transactions.userId,
            type: transactions.type,
            amount: transactions.amount,
            description: transactions.description,
            status: transactions.status,
            createdAt: transactions.createdAt,
            updatedAt: transactions.updatedAt,
            processedBy: transactions.processedBy,
            rejectionReason: transactions.rejectionReason,
            transactionHash: transactions.transactionHash,
            cryptoType: transactions.cryptoType,
            walletAddress: transactions.walletAddress
            // Excluding new columns that don't exist yet: planName, planDuration, dailyProfit, totalReturn, expectedCompletionDate
          }).from(transactions);
      
      return await query.limit(options.limit).offset(options.offset);
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }

  async getTransactionCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(transactions);
      return result[0].count;
    } catch (error) {
      console.error('Failed to get transaction count:', error);
      return 0;
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      return await db.select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        processedBy: transactions.processedBy,
        rejectionReason: transactions.rejectionReason,
        transactionHash: transactions.transactionHash,
        cryptoType: transactions.cryptoType,
        walletAddress: transactions.walletAddress
      })
        .from(transactions)
        .orderBy(desc(transactions.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  async getPendingDeposits(options: { limit: number; offset: number }): Promise<Transaction[]> {
    try {
      return await db.select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        processedBy: transactions.processedBy,
        rejectionReason: transactions.rejectionReason,
        transactionHash: transactions.transactionHash,
        cryptoType: transactions.cryptoType,
        walletAddress: transactions.walletAddress
      })
        .from(transactions)
        .where(and(
          eq(transactions.type, 'deposit'),
          eq(transactions.status, 'pending')
        ))
        .limit(options.limit)
        .offset(options.offset);
    } catch (error) {
      console.error('Failed to get pending deposits:', error);
      return [];
    }
  }

  async getPendingDepositCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(
          eq(transactions.type, 'deposit'),
          eq(transactions.status, 'pending')
        ));
      return result[0].count;
    } catch (error) {
      console.error('Failed to get pending deposit count:', error);
      return 0;
    }
  }

  async getPendingWithdrawalCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(
          eq(transactions.type, 'withdrawal'),
          eq(transactions.status, 'pending')
        ));
      return result[0].count;
    } catch (error) {
      console.error('Failed to get pending withdrawal count:', error);
      return 0;
    }
  }

  async getTotalDepositAmount(): Promise<number> {
    try {
      const result = await db.select({
        total: sql<number>`coalesce(sum(amount), 0)`
      })
      .from(transactions)
      .where(and(
        eq(transactions.type, 'deposit'),
        eq(transactions.status, 'completed')
      ));
      return result[0].total;
    } catch (error) {
      console.error('Failed to get total deposit amount:', error);
      return 0;
    }
  }

  async getTotalWithdrawalAmount(): Promise<number> {
    try {
      const result = await db.select({
        total: sql<number>`coalesce(sum(amount), 0)`
      })
      .from(transactions)
      .where(and(
        eq(transactions.type, 'withdrawal'),
        eq(transactions.status, 'completed')
      ));
      return result[0].total;
    } catch (error) {
      console.error('Failed to get total withdrawal amount:', error);
      return 0;
    }
  }

  // User methods
  async searchUsers(query: string): Promise<User[]> {
    try {
      return await db.select().from(users).where(
        or(
          like(users.username, `%${query}%`),
          like(users.email, `%${query}%`),
          like(users.firstName, `%${query}%`),
          like(users.lastName, `%${query}%`)
        )
      );
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  async getUsers(options: GetUsersOptions): Promise<User[]> {
    try {
      let whereClause: any = undefined;
      const conditions: any[] = [];
      
      if (options.search) {
        conditions.push(or(
          like(users.username, `%${options.search}%`),
          like(users.email, `%${options.search}%`),
          like(users.firstName, `%${options.search}%`),
          like(users.lastName, `%${options.search}%`)
        ));
      }
      
      if (options.status) {
        if (options.status === 'active') {
          conditions.push(eq(users.isActive, true));
        } else if (options.status === 'inactive') {
          conditions.push(eq(users.isActive, false));
        } else if (options.status === 'verified') {
          conditions.push(eq(users.isVerified, true));
        } else if (options.status === 'unverified') {
          conditions.push(eq(users.isVerified, false));
        }
      }
      
      if (conditions.length > 0) {
        whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      }
      
      const query = whereClause 
        ? db.select().from(users).where(whereClause)
        : db.select().from(users);
        
      return await query.limit(options.limit).offset(options.offset);
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(users);
      return result[0].count;
    } catch (error) {
      console.error('Failed to get user count:', error);
      return 0;
    }
  }

  async getPendingVerificationCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isVerified, false));
      return result[0].count;
    } catch (error) {
      console.error('Failed to get pending verification count:', error);
      return 0;
    }
  }

  async getRecentRegistrations(limit: number = 10): Promise<User[]> {
    try {
      return await db.select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get recent registrations:', error);
      return [];
    }
  }

  // Notification methods
  async createNotification(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    priority?: string;
    expiresAt?: Date;
  }): Promise<Notification> {
    try {
      const result = await db.insert(notifications).values({
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        priority: (data.priority as any) || 'medium',
        expiresAt: data.expiresAt
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  // Audit log methods
  async getAuditLogs(options: GetAuditLogsOptions): Promise<AuditLog[]> {
    try {
      if (options.action && options.search) {
        return await db.select().from(auditLogs)
          .where(and(
            eq(auditLogs.action, options.action),
            like(auditLogs.details, `%${options.search}%`)
          ))
          .limit(options.limit).offset(options.offset);
      } else if (options.action) {
        return await db.select().from(auditLogs)
          .where(eq(auditLogs.action, options.action))
          .limit(options.limit).offset(options.offset);
      } else if (options.search) {
        return await db.select().from(auditLogs)
          .where(like(auditLogs.details, `%${options.search}%`))
          .limit(options.limit).offset(options.offset);
      } else {
        return await db.select().from(auditLogs)
          .limit(options.limit).offset(options.offset);
      }
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  async getAuditLogCount(options: { search?: string; action?: string } = {}): Promise<number> {
    try {
      let result;
      if (options.action && options.search) {
        result = await db.select({ count: sql<number>`count(*)` }).from(auditLogs)
          .where(and(
            eq(auditLogs.action, options.action),
            like(auditLogs.details, `%${options.search}%`)
          ));
      } else if (options.action) {
        result = await db.select({ count: sql<number>`count(*)` }).from(auditLogs)
          .where(eq(auditLogs.action, options.action));
      } else if (options.search) {
        result = await db.select({ count: sql<number>`count(*)` }).from(auditLogs)
          .where(like(auditLogs.details, `%${options.search}%`));
      } else {
        result = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
      }
      
      return result[0].count;
    } catch (error) {
      console.error('Failed to get audit log count:', error);
      return 0;
    }
  }

  async getRecentLogins(limit: number = 10): Promise<AuditLog[]> {
    try {
      return await db.select()
        .from(auditLogs)
        .where(eq(auditLogs.action, 'login'))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get recent logins:', error);
      return [];
    }
  }

  // Visitor tracking methods
  async getActiveVisitors(): Promise<VisitorTracking[]> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return await db.select()
        .from(visitor_tracking)
        .where(sql`${visitor_tracking.lastActivity} > ${fiveMinutesAgo}`)
        .orderBy(desc(visitor_tracking.lastActivity));
    } catch (error) {
      console.error('Failed to get active visitors:', error);
      return [];
    }
  }

  // Additional user methods required by auth.ts
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Failed to get user ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Failed to get user by username ${username}:`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Failed to get user by email ${email}:`, error);
      return undefined;
    }
  }

  async createUser(userData: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: "user" | "admin";
    balance?: string;
    isActive?: boolean;
    isVerified?: boolean;
    twoFactorEnabled?: boolean;
    referredBy?: number | null;
    bitcoinAddress?: string | null;
    bitcoinCashAddress?: string | null;
    ethereumAddress?: string | null;
    bnbAddress?: string | null;
    usdtTrc20Address?: string | null;
    verificationToken?: string | null;
    verificationTokenExpiry?: Date | null;
  }): Promise<User | undefined> {
    try {
      const result = await db.insert(users).values({
        username: userData.username,
        password: userData.password,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "user",
        balance: userData.balance || "0",
        isActive: userData.isActive ?? true,
        isVerified: userData.isVerified ?? false,
        twoFactorEnabled: userData.twoFactorEnabled ?? false,
        referredBy: userData.referredBy || null,
        bitcoinAddress: userData.bitcoinAddress || null,
        bitcoinCashAddress: userData.bitcoinCashAddress || null,
        ethereumAddress: userData.ethereumAddress || null,
        bnbAddress: userData.bnbAddress || null,
        usdtTrc20Address: userData.usdtTrc20Address || null,
        verificationToken: userData.verificationToken || null,
        verificationTokenExpiry: userData.verificationTokenExpiry || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Failed to create user:', error);
      return undefined;
    }
  }

  async updateUser(id: number, updates: Partial<{
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "user" | "admin";
    balance: string;
    isActive: boolean;
    isVerified: boolean;
    twoFactorEnabled: boolean;
    verificationToken: string | null;
    verificationTokenExpiry: Date | null;
    pendingEmail: string | null;
  }>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Check if user has associated records that would prevent deletion
      const userTransactions = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.userId, id));
      
      let auditLogCount = 0;
      let logsCount = 0;
      
      // Check audit_logs table if it exists
      try {
        const userAuditLogs = await db.select({ count: sql<number>`count(*)` })
          .from(auditLogs)
          .where(eq(auditLogs.userId, id));
        auditLogCount = userAuditLogs[0].count;
      } catch (auditError: any) {
        if (auditError.message?.includes('does not exist') || auditError.code === '42P01') {
          console.log('Audit logs table does not exist, proceeding without audit log check');
          auditLogCount = 0;
        } else {
          throw auditError;
        }
      }
      
      // Check for other log tables that might have foreign keys (like 'logs' table)
      try {
        const userLogs = await db.execute(sql`SELECT COUNT(*) as count FROM logs WHERE user_id = ${id}`);
        logsCount = Number(userLogs.rows[0]?.count || 0);
      } catch (logsError: any) {
        if (logsError.message?.includes('does not exist') || logsError.code === '42P01') {
          console.log('Logs table does not exist, proceeding without logs check');
          logsCount = 0;
        } else {
          console.log('Cannot check logs table:', logsError.message);
          logsCount = 0;
        }
      }
      
      const transactionCount = userTransactions[0].count;
      const totalAssociatedRecords = transactionCount + auditLogCount + logsCount;
      
      // If user has associated records, deactivate instead of deleting
      if (totalAssociatedRecords > 0) {
        console.log(`User ${id} has ${transactionCount} transactions, ${auditLogCount} audit logs, and ${logsCount} log entries. Deactivating instead of deleting.`);
        
        const deactivated = await this.updateUser(id, {
          isActive: false,
          username: `deleted_user_${id}_${Date.now()}`,
          email: `deleted_${id}_${Date.now()}@deleted.local`
        });
        
        return deactivated !== undefined;
      }
      
      // If no associated records, attempt to delete
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      
      // If it's any kind of constraint error, try deactivation
      if (error instanceof Error && (
        error.message.includes('foreign key') || 
        error.message.includes('constraint') ||
        error.message.includes('violates') ||
        error.message.includes('referenced')
      )) {
        console.log(`Constraint violation detected for user ${id}. Attempting deactivation.`);
        try {
          const deactivated = await this.updateUser(id, {
            isActive: false,
            username: `deleted_user_${id}_${Date.now()}`,
            email: `deleted_${id}_${Date.now()}@deleted.local`
          });
          return deactivated !== undefined;
        } catch (deactivationError) {
          console.error(`Failed to deactivate user ${id}:`, deactivationError);
          return false;
        }
      }
      
      return false;
    }
  }

  async canUserBeDeleted(id: number): Promise<{ canDelete: boolean; reason?: string; associatedRecords: { transactions: number; auditLogs: number; logs: number } }> {
    try {
      const userTransactions = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.userId, id));
      
      let auditLogCount = 0;
      let logsCount = 0;
      
      // Check audit_logs table if it exists
      try {
        const userAuditLogs = await db.select({ count: sql<number>`count(*)` })
          .from(auditLogs)
          .where(eq(auditLogs.userId, id));
        auditLogCount = userAuditLogs[0].count;
      } catch (auditError: any) {
        if (auditError.message?.includes('does not exist') || auditError.code === '42P01') {
          console.log('Audit logs table does not exist, proceeding without audit log check');
          auditLogCount = 0;
        } else {
          throw auditError;
        }
      }
      
      // Check for other log tables
      try {
        const userLogs = await db.execute(sql`SELECT COUNT(*) as count FROM logs WHERE user_id = ${id}`);
        logsCount = Number(userLogs.rows[0]?.count || 0);
      } catch (logsError: any) {
        if (logsError.message?.includes('does not exist') || logsError.code === '42P01') {
          console.log('Logs table does not exist, proceeding without logs check');
          logsCount = 0;
        } else {
          console.log('Cannot check logs table:', logsError.message);
          logsCount = 0;
        }
      }
      
      const transactionCount = userTransactions[0].count;
      
      const associatedRecords = {
        transactions: transactionCount,
        auditLogs: auditLogCount,
        logs: logsCount
      };
      
      const totalAssociatedRecords = transactionCount + auditLogCount + logsCount;
      
      if (totalAssociatedRecords > 0) {
        return {
          canDelete: false,
          reason: `User has ${transactionCount} transactions, ${auditLogCount} audit log entries, and ${logsCount} log entries`,
          associatedRecords
        };
      }
      
      return {
        canDelete: true,
        associatedRecords
      };
    } catch (error) {
      console.error(`Failed to check if user ${id} can be deleted:`, error);
      return {
        canDelete: false,
        reason: 'Error checking user deletion eligibility',
        associatedRecords: { transactions: 0, auditLogs: 0, logs: 0 }
      };
    }
  }

  // Audit log methods
  async createLog(logData: {
    type: string;
    userId?: number;
    message: string;
    details?: any;
  }): Promise<AuditLog | undefined> {
    try {
      const result = await db.insert(auditLogs).values({
        userId: logData.userId || null,
        action: logData.type,
        description: logData.message,
        details: typeof logData.details === 'object' ? JSON.stringify(logData.details) : logData.details || null,
        ipAddress: null, // Could be passed in if needed
        userAgent: null, // Could be passed in if needed
        createdAt: new Date()
      }).returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error: any) {
      // If audit_logs table doesn't exist, just log to console and return undefined
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.log('Audit logs table does not exist, logging to console instead:', logData);
        return undefined;
      }
      console.error('Failed to create log:', error);
      return undefined;
    }
  }

  // Database connection check
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Simple query to test connection
      await db.select({ count: sql<number>`1` }).from(users).limit(1);
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  // Additional methods required by routes.ts
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    try {
      return await db.select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        processedBy: transactions.processedBy,
        rejectionReason: transactions.rejectionReason,
        transactionHash: transactions.transactionHash,
        cryptoType: transactions.cryptoType,
        walletAddress: transactions.walletAddress
        // Excluding new columns that don't exist yet: planName, planDuration, dailyProfit, totalReturn, expectedCompletionDate
      })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt));
    } catch (error) {
      console.error(`Failed to get user transactions for ${userId}:`, error);
      return [];
    }
  }

  async createTransaction(transactionData: {
    userId: number;
    type: 'deposit' | 'withdrawal' | 'investment';
    amount: string;
    status?: TransactionStatus;
    description?: string;
    planName?: string;
    cryptoType?: string;
    walletAddress?: string;
    transactionHash?: string;
    planDuration?: string;
    dailyProfit?: number;
    totalReturn?: number;
  }): Promise<Transaction | undefined> {
    try {
      // Map investment to deposit for now since the DB schema only supports deposit/withdrawal
      const dbType = transactionData.type === 'investment' ? 'deposit' : transactionData.type;
      
      // Only insert fields that exist in the current schema
      const result = await db.insert(transactions).values({
        userId: transactionData.userId,
        type: dbType as any,
        amount: transactionData.amount,
        status: transactionData.status || 'pending',
        description: transactionData.description || '',
        planName: transactionData.planName || null,
        cryptoType: transactionData.cryptoType || null,
        walletAddress: transactionData.walletAddress || null,
        transactionHash: transactionData.transactionHash || null,
        createdAt: new Date(),
        updatedAt: new Date()
        // Note: planDuration, dailyProfit, totalReturn, expectedCompletionDate are not included 
        // until the database schema is updated
      }).returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Failed to create transaction:', error);
      return undefined;
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true));
      return result[0].count;
    } catch (error) {
      console.error('Failed to get active user count:', error);
      return 0;
    }
  }

  async getPendingTransactionCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.status, 'pending'));
      return result[0].count;
    } catch (error) {
      console.error('Failed to get pending transaction count:', error);
      return 0;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await db.select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        processedBy: transactions.processedBy,
        rejectionReason: transactions.rejectionReason,
        transactionHash: transactions.transactionHash,
        cryptoType: transactions.cryptoType,
        walletAddress: transactions.walletAddress,
        planName: transactions.planName
      }).from(transactions).orderBy(desc(transactions.createdAt));
    } catch (error) {
      console.error('Failed to get all transactions:', error);
      return [];
    }
  }

  async getDeposits(options: { 
    limit: number; 
    offset: number; 
    status?: string; 
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    method?: string;
    amountMin?: number;
    amountMax?: number;
  }): Promise<any[]> {
    try {
      const conditions: any[] = [eq(transactions.type, 'deposit')];
      
      if (options.status) {
        conditions.push(eq(transactions.status, options.status as TransactionStatus));
      }
      
      if (options.search) {
        conditions.push(or(
          like(transactions.description, `%${options.search}%`),
          like(transactions.transactionHash, `%${options.search}%`)
        ));
      }

      if (options.dateFrom) {
        conditions.push(gte(transactions.createdAt, new Date(options.dateFrom)));
      }

      if (options.dateTo) {
        conditions.push(lte(transactions.createdAt, new Date(options.dateTo)));
      }

      if (options.method) {
        conditions.push(eq(transactions.cryptoType, options.method));
      }

      if (options.amountMin !== undefined) {
        conditions.push(gte(transactions.amount, options.amountMin.toString()));
      }

      if (options.amountMax !== undefined) {
        conditions.push(lte(transactions.amount, options.amountMax.toString()));
      }
      
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      
      // Select only existing columns for now
      const result = await db.select({
        id: transactions.id,
        user_id: transactions.userId,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        created_at: transactions.createdAt,
        updated_at: transactions.updatedAt,
        crypto_type: transactions.cryptoType,
        transaction_hash: transactions.transactionHash,
        wallet_address: transactions.walletAddress,
        user: {
          id: users.id,
          username: users.username,
          email: users.email
        }
      })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id))
        .where(whereClause)
        .limit(options.limit)
        .offset(options.offset)
        .orderBy(desc(transactions.createdAt));

      return result;
    } catch (error) {
      console.error('Failed to get deposits:', error);
      return [];
    }
  }

  async getDepositCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.type, 'deposit'));
      return result[0].count;
    } catch (error) {
      console.error('Failed to get deposit count:', error);
      return 0;
    }
  }

  async getWithdrawals(options: { limit: number; offset: number; status?: string; search?: string }): Promise<Transaction[]> {
    try {
      const conditions: any[] = [eq(transactions.type, 'withdrawal')];
      
      if (options.status) {
        conditions.push(eq(transactions.status, options.status as TransactionStatus));
      }
      
      if (options.search) {
        conditions.push(or(
          like(transactions.description, `%${options.search}%`),
          like(transactions.transactionHash, `%${options.search}%`)
        ));
      }
      
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      
      return await db.select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        processedBy: transactions.processedBy,
        rejectionReason: transactions.rejectionReason,
        transactionHash: transactions.transactionHash,
        cryptoType: transactions.cryptoType,
        walletAddress: transactions.walletAddress
      })
        .from(transactions)
        .where(whereClause)
        .limit(options.limit)
        .offset(options.offset)
        .orderBy(desc(transactions.createdAt));
    } catch (error) {
      console.error('Failed to get withdrawals:', error);
      return [];
    }
  }

  async getWithdrawalCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.type, 'withdrawal'));
      return result[0].count;
    } catch (error) {
      console.error('Failed to get withdrawal count:', error);
      return 0;
    }
  }

  async updateWithdrawalStatus(id: number, status: TransactionStatus): Promise<Transaction | undefined> {
    return this.updateTransactionStatus(id, status);
  }

  async updateDepositStatus(id: number, status: TransactionStatus): Promise<Transaction | undefined> {
    return this.updateTransactionStatus(id, status);
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      await db.delete(transactions).where(eq(transactions.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete transaction ${id}:`, error);
      return false;
    }
  }

  async getAllUsersForExport(): Promise<User[]> {
    return this.getAllUsers();
  }

  async getAllTransactionsForExport(): Promise<Transaction[]> {
    return this.getAllTransactions();
  }

  // System settings methods (placeholder implementations)
  async getMaintenanceSettings(): Promise<any> {
    try {
      // Return default maintenance settings
      return {
        enabled: false,
        message: "The system is temporarily under maintenance. Please try again later.",
        startTime: null,
        endTime: null
      };
    } catch (error) {
      console.error('Failed to get maintenance settings:', error);
      return { enabled: false, message: "Maintenance mode disabled" };
    }
  }

  async updateMaintenanceSettings(settings: any): Promise<any> {
    try {
      // In a real implementation, this would update a settings table
      // For now, just return the settings as if they were saved
      return settings;
    } catch (error) {
      console.error('Failed to update maintenance settings:', error);
      return null;
    }
  }

  async getSystemSettings(): Promise<any> {
    try {
      // Return default system settings
      return {
        siteName: "Axix Finance",
        supportEmail: "support@axixfinance.com",
        maintenanceMode: false,
        registrationEnabled: true
      };
    } catch (error) {
      console.error('Failed to get system settings:', error);
      return {};
    }
  }

  async updateSystemSettings(settings: any): Promise<any> {
    try {
      // In a real implementation, this would update a settings table
      // For now, just return the settings as if they were saved
      return settings;
    } catch (error) {
      console.error('Failed to update system settings:', error);
      return null;
    }
  }

  async getAllSettings(): Promise<any[]> {
    try {
      // Return placeholder settings
      return [
        { name: "siteName", value: "Axix Finance" },
        { name: "supportEmail", value: "support@axixfinance.com" },
        { name: "maintenanceMode", value: "false" },
        { name: "registrationEnabled", value: "true" }
      ];
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return [];
    }
  }

  async getSetting(name: string): Promise<any> {
    try {
      const allSettings = await this.getAllSettings();
      return allSettings.find(setting => setting.name === name);
    } catch (error) {
      console.error(`Failed to get setting ${name}:`, error);
      return null;
    }
  }

  async createOrUpdateSetting(name: string, value: string, description?: string): Promise<void> {
    try {
      // In a real implementation, this would insert/update a settings table
      // For now, just log that the setting would be created/updated
      if (process.env.NODE_ENV !== "production") {
        console.log(`Setting '${name}' would be set to '${value}'${description ? ` (${description})` : ''}`);
      }
    } catch (error) {
      console.error(`Failed to create/update setting ${name}:`, error);
      throw error;
    }
  }

  async initializeDatabase(): Promise<void> {
    try {
      // Initialize required settings
      const requiredSettings = [
        { name: 'minimumWithdrawal', value: '50', description: 'Minimum withdrawal amount in USD' },
        { name: 'withdrawalFee', value: '5', description: 'Withdrawal fee percentage' },
        { name: 'referralBonus', value: '10', description: 'Referral bonus percentage' },
        { name: 'maintenanceMode', value: 'false', description: 'System maintenance mode' },
        { name: 'contactEmail', value: process.env.CONTACT_EMAIL || 'support@axixfinance.com', description: 'Support contact email' }
      ];
      
      // Create or update required settings
      for (const setting of requiredSettings) {
        const existingSetting = await this.getSetting(setting.name);
        if (!existingSetting) {
          await this.createOrUpdateSetting(setting.name, setting.value, setting.description);
          if (process.env.NODE_ENV !== "production") console.log(`Setting '${setting.name}' initialized`);
        }
      }
      
      if (process.env.NODE_ENV !== "production") console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }
}

// Export default instance
export default new DatabaseStorage();
