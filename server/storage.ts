import { 
  users, type User, type InsertUser, 
  transactions, type Transaction, type InsertTransaction, 
  logs, type Log, type InsertLog,
  messages, type Message, type InsertMessage,
  settings, type Setting, type InsertSetting,
  notifications, type Notification, type InsertNotification,
  transactionStatusEnum, roleEnum, transactionTypeEnum, logTypeEnum, messageStatusEnum,
  notificationTypeEnum, notificationPriorityEnum,
  type TransactionStatus, type TransactionType, type LogType, type MessageStatus,
  type NotificationType, type NotificationPriority
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, between, like, sql, desc, asc, isNull, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsers(options: { limit: number; offset: number; search?: string; status?: string }): Promise<User[]>;
  getUserCount(): Promise<number>;
  createUser(user: InsertUser): Promise<User | undefined>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  updateUserProfile(userId: number, data: Partial<User>): Promise<User | undefined>;
  updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User | undefined>;
  updateUserActiveStatus(userId: number, isActive: boolean): Promise<User | undefined>;
  updateUser2FAStatus(userId: number, enabled: boolean, secret?: string): Promise<User | undefined>;  getUserReferrals(referrerId: number): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  updateUser(userId: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(userId: number): Promise<boolean>;
  getActiveUserCount(): Promise<number>;
  // Add missing verification functions
  updateUserVerificationToken(userId: number, token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  // Transaction methods
  getTransaction(id: number): Promise<Transaction | undefined>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  getPendingTransactions(): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  getTransactionsByStatus(status: TransactionStatus): Promise<Transaction[]>;
  getTransactionsByType(type: TransactionType): Promise<Transaction[]>;
  searchTransactions(query: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: TransactionStatus, rejectionReason?: string): Promise<Transaction | undefined>;
  
  // Database management
  checkDatabaseConnection(): Promise<boolean>;
  initializeDatabase(): Promise<void>;
  
  // Log methods
  createLog(log: InsertLog): Promise<Log>;
  getLogs(limit?: number, offset?: number): Promise<Log[]>;
  getAllLogs(): Promise<Log[]>;
  getUserLogs(userId: number): Promise<Log[]>;
  getLogsByType(type: LogType): Promise<Log[]>;
  getLogsByDateRange(startDate: Date, endDate: Date): Promise<Log[]>;
  searchLogs(query: string): Promise<Log[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessage(id: number): Promise<Message | undefined>;
  getUserMessages(userId: number): Promise<Message[]>;
  getAllMessages(): Promise<Message[]>;
  getUnreadMessages(): Promise<Message[]>;
  updateMessageStatus(id: number, status: MessageStatus): Promise<Message | undefined>;
  
  // Notification methods
  getUserNotifications(userId: number, options?: {
    type?: NotificationType;
    priority?: NotificationPriority;
    read?: boolean;
    offset?: number;
    limit?: number;
  }): Promise<{ notifications: Notification[]; total: number }>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  createBulkNotifications(notifications: InsertNotification[]): Promise<number>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  getNotificationPreferences(userId: number): Promise<any | undefined>;
  updateNotificationPreferences(userId: number, preferences: any): Promise<any>;
    // Settings methods
  getSetting(name: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  createOrUpdateSetting(name: string, value: string, description?: string): Promise<Setting>;
  
  // Additional admin methods needed by routes
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  getPendingTransactionCount(): Promise<number>;
  getTransactions(options: { limit: number; offset: number; search?: string; status?: string; type?: string; dateFrom?: string; dateTo?: string }): Promise<Transaction[]>;
  getTransactionCount(): Promise<number>;
  getDeposits(options: { limit: number; offset: number; search?: string; status?: string; dateFrom?: string; dateTo?: string; method?: string; amountMin?: number; amountMax?: number }): Promise<Transaction[]>;
  getDepositCount(): Promise<number>;
  updateDepositStatus(id: number, status: TransactionStatus): Promise<Transaction | undefined>;
  getWithdrawals(options: { limit: number; offset: number; search?: string; status?: string; dateFrom?: string; dateTo?: string; method?: string; amountMin?: number; amountMax?: number }): Promise<Transaction[]>;
  getWithdrawalCount(): Promise<number>;
  updateWithdrawalStatus(id: number, status: TransactionStatus): Promise<Transaction | undefined>;
  getAuditLogs(options: { limit: number; offset: number; search?: string; action?: string; dateFrom?: string; dateTo?: string }): Promise<Log[]>;
  getAuditLogCount(): Promise<number>;
  getAllUsersForExport(): Promise<User[]>;
  getAllTransactionsForExport(): Promise<Transaction[]>;
  getMaintenanceSettings(): Promise<Setting | undefined>;
  updateMaintenanceSettings(enabled: boolean, message?: string): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  // Database management methods
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Try to execute a simple query to check connection
      const result = await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
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
        { name: 'contactEmail', value: process.env.CONTACT_EMAIL || 'support@caraxfinance.com', description: 'Support contact email' }
      ];
      
      // Create or update required settings
      for (const setting of requiredSettings) {
        const existingSetting = await this.getSetting(setting.name);
        if (!existingSetting) {
          await this.createOrUpdateSetting(setting.name, setting.value, setting.description);
          console.log(`Setting '${setting.name}' initialized`);
        }
      }
      
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log(`Looking up user by username: ${username}`);
      const result = await db.select().from(users).where(eq(users.username, username));
      return result.length > 0 ? mapUserResult(result[0]) : undefined;
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(mapUserResult);
  }  async createUser(user: InsertUser): Promise<User | undefined> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result.length > 0 ? mapUserResult(result[0]) : undefined;
    } catch (error) {
      console.error('Error creating user:', error);
      return undefined;
    }
  }

  async updateUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const newBalance = parseFloat(user.balance as string) + amount;
    
    const result = await db.update(users)
      .set({ balance: newBalance.toString() })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }
  
  async updateUserProfile(userId: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Remove sensitive fields that shouldn't be updated
    const { id, password, balance, role, createdAt, ...updateData } = data;
    
    const result = await db.update(users)
      .set({ 
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }
  
  async updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const result = await db.update(users)
      .set({ 
        isVerified,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }
  
  async updateUserActiveStatus(userId: number, isActive: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const result = await db.update(users)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }
  
  async updateUser2FAStatus(userId: number, enabled: boolean, secret?: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const result = await db.update(users)
      .set({ 
        twoFactorEnabled: enabled,
        twoFactorSecret: secret,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }
  
  async updateUserVerificationToken(userId: number, token: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const result = await db.update(users)
      .set({ 
        verificationToken: token,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.verificationToken, token));
      return result.length > 0 ? mapUserResult(result[0]) : undefined;
    } catch (error) {    console.error('Database error in getUserByVerificationToken:', error);
      return undefined;
    }
  }
  
  async getUserReferrals(referrerId: number): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.referredBy, referrerId));
    return result.map(mapUserResult);
  }
  
  async searchUsers(query: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    const result = await db.select().from(users)
      .where(
        or(
          like(users.username, searchPattern),
          like(users.email, searchPattern),
          like(users.firstName, searchPattern),
          like(users.lastName, searchPattern)
        )
      );
    return result.map(mapUserResult);
  }  async getUsers(options: { limit: number; offset: number; search?: string; status?: string }): Promise<User[]> {
    try {
      let conditions: any[] = [];
      
      // Add search filter
      if (options.search) {
        conditions.push(
          or(
            like(users.username, `%${options.search}%`),
            like(users.email, `%${options.search}%`),
            like(users.firstName, `%${options.search}%`),
            like(users.lastName, `%${options.search}%`)
          )
        );
      }
      
      // Add status filter
      if (options.status === 'active') {
        conditions.push(eq(users.isActive, true));
      } else if (options.status === 'inactive') {
        conditions.push(eq(users.isActive, false));
      } else if (options.status === 'verified') {
        conditions.push(eq(users.isVerified, true));
      } else if (options.status === 'unverified') {
        conditions.push(eq(users.isVerified, false));
      }
      
      let result;
      // Build query based on whether we have conditions
      if (conditions.length > 0) {
        result = await db.select()
          .from(users)
          .where(and(...conditions))
          .limit(options.limit)
          .offset(options.offset)
          .orderBy(desc(users.createdAt));
      } else {
        result = await db.select()
          .from(users)
          .limit(options.limit)
          .offset(options.offset)
          .orderBy(desc(users.createdAt));
      }
      
      return result.map(mapUserResult);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(users);
      return result[0].count;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User | undefined> {
    try {
      const updateData: any = {};
      
      // Only include fields that exist in the users table
      if (data.username !== undefined) updateData.username = data.username;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.balance !== undefined) updateData.balance = data.balance;
      if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = data.twoFactorEnabled;
      if (data.twoFactorSecret !== undefined) updateData.twoFactorSecret = data.twoFactorSecret;
      
      const result = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      return result.length > 0 ? mapUserResult(result[0]) : undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true));
      return result[0].count;
    } catch (error) {
      console.error('Error getting active user count:', error);
      return 0;
    }
  }

  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.status, "pending"));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values({
      ...insertTransaction,
    }).returning();
    
    return result[0];
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(
        and(
          sql`${transactions.createdAt} >= ${startDate}`,
          sql`${transactions.createdAt} <= ${endDate}`
        )
      )
      .orderBy(desc(transactions.createdAt));
  }
  
  async getTransactionsByStatus(status: TransactionStatus): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.status, status))
      .orderBy(desc(transactions.createdAt));
  }
  
  async getTransactionsByType(type: TransactionType): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.type, type))
      .orderBy(desc(transactions.createdAt));
  }
  
  async searchTransactions(query: string): Promise<Transaction[]> {
    const searchPattern = `%${query}%`;
    const queryAsNumber = parseFloat(query);
    
    // If query is a number, also search by amount
    if (!isNaN(queryAsNumber)) {
      return await db.select().from(transactions)
        .where(
          or(
            like(transactions.description, searchPattern),
            sql`CAST(${transactions.amount} AS TEXT) LIKE ${searchPattern}`
          )
        )
        .orderBy(desc(transactions.createdAt));
    }
    
    // Otherwise just search by description
    return await db.select().from(transactions)
      .where(like(transactions.description, searchPattern))
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransactionStatus(
    id: number, 
    status: TransactionStatus, 
    rejectionReason?: string
  ): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;

    const updateData: Record<string, any> = { 
      status, 
      updatedAt: new Date()
    };
    
    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const result = await db.update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    
    // If the transaction is completed, update user balance
    if (status === "completed") {
      const amount = parseFloat(transaction.amount as string);
      if (transaction.type === "deposit" || transaction.type === "transfer") {
        await this.updateUserBalance(transaction.userId, amount);
      } else if (transaction.type === "withdrawal" || transaction.type === "investment") {
        await this.updateUserBalance(transaction.userId, -amount);
      }
      
      // Create log entry for completed transaction
      await this.createLog({
        type: "audit",
        message: `Transaction #${id} (${transaction.type}) was completed`,
        userId: transaction.userId,
        details: { transactionId: id, amount: transaction.amount }
      });
    } else if (status === "rejected") {
      // Create log entry for rejected transaction
      await this.createLog({
        type: "audit",
        message: `Transaction #${id} (${transaction.type}) was rejected`,
        userId: transaction.userId,
        details: { 
          transactionId: id, 
          amount: transaction.amount,
          reason: rejectionReason || "No reason provided" 
        }
      });
    }

    return result.length > 0 ? result[0] : undefined;
  }
  
  // Log methods
  async createLog(log: InsertLog): Promise<Log> {
    const result = await db.insert(logs).values(log).returning();
    return result[0];
  }
  
  async getLogs(limit: number = 100, offset: number = 0): Promise<Log[]> {
    return await db.select().from(logs)
      .orderBy(desc(logs.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async getAllLogs(): Promise<Log[]> {
    return await db.select().from(logs)
      .orderBy(desc(logs.createdAt));
  }
  
  async getUserLogs(userId: number): Promise<Log[]> {
    return await db.select().from(logs)
      .where(eq(logs.userId, userId))
      .orderBy(desc(logs.createdAt));
  }
  
  async getLogsByType(type: LogType): Promise<Log[]> {
    return await db.select().from(logs)
      .where(eq(logs.type, type))
      .orderBy(desc(logs.createdAt));
  }
  
  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<Log[]> {
    return await db.select().from(logs)
      .where(
        and(
          sql`${logs.createdAt} >= ${startDate}`,
          sql`${logs.createdAt} <= ${endDate}`
        )
      )
      .orderBy(desc(logs.createdAt));
  }
  
  async searchLogs(query: string): Promise<Log[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(logs)
      .where(like(logs.message, searchPattern))
      .orderBy(desc(logs.createdAt));
  }  
  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }
  
  async getMessage(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserMessages(userId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt));
  }
  
  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages)
      .orderBy(desc(messages.createdAt));
  }
  
  async getUnreadMessages(): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.status, "unread"))
      .orderBy(desc(messages.createdAt));
  }
  
  async updateMessageStatus(id: number, status: MessageStatus): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;

    const result = await db.update(messages)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(messages.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  // Notification methods
  async getUserNotifications(
    userId: number, 
    options: {
      type?: NotificationType;
      priority?: NotificationPriority;
      read?: boolean;
      offset?: number;
      limit?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { type, priority, read, offset = 0, limit = 20 } = options;
      
      // Build the query with filters
      let query = db.select().from(notifications).where(and(
        eq(notifications.userId, userId),
        type ? eq(notifications.type, type) : sql`true`,
        priority ? eq(notifications.priority, priority) : sql`true`,
        read !== undefined ? eq(notifications.isRead, read) : sql`true`
      ));
      
      // Get total count (for pagination)
      let countQuery = db.select({ count: sql<number>`COUNT(*)` }).from(notifications).where(and(
        eq(notifications.userId, userId),
        type ? eq(notifications.type, type) : sql`true`,
        priority ? eq(notifications.priority, priority) : sql`true`,
        read !== undefined ? eq(notifications.isRead, read) : sql`true`
      ));
      
      const countResult = await countQuery;
      const [{ count }] = countResult;
      
      // Get paginated results
      const queryResults = await query;
      const results = queryResults;
      
      return {
        notifications: results,
        total: count
      };
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return { notifications: [], total: 0 };
    }
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    try {
      const result = await db.select().from(notifications).where(eq(notifications.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error in getNotification:', error);
      return undefined;
    }
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const result = await db.insert(notifications).values(notification).returning();
      return result[0];
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw new Error('Failed to create notification');
    }
  }
  
  async createBulkNotifications(notificationsData: InsertNotification[]): Promise<number> {
    try {
      // Use a transaction to ensure all or none are inserted
      const result = await db.transaction(async (tx) => {
        const insertedNotifications = await tx.insert(notifications)
          .values(notificationsData)
          .returning();
        
        return insertedNotifications.length;
      });
      
      return result;
    } catch (error) {
      console.error('Error in createBulkNotifications:', error);
      throw new Error('Failed to create bulk notifications');
    }
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    try {
      const notification = await this.getNotification(id);
      if (!notification) return undefined;
      
      const result = await db.update(notifications)
        .set({ 
          isRead: true 
        })
        .where(eq(notifications.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      return undefined;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<number> {
    try {
      const result = await db.update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        )
        .returning();
      
      return result.length;
    } catch (error) {
      console.error('Error in markAllNotificationsAsRead:', error);
      return 0;
    }
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    try {
      const result = await db.delete(notifications)
        .where(eq(notifications.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const [{ count }] = await db.select({ 
        count: sql<number>`count(*)` 
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
      
      return count;
    } catch (error) {
      console.error('Error in getUnreadNotificationCount:', error);
      return 0;
    }
  }
  
  // These methods would typically use a separate table, but for simplicity 
  // we'll use the settings table to store user preferences
  async getNotificationPreferences(userId: number): Promise<any | undefined> {
    try {
      const prefsSettingName = `notification_preferences_${userId}`;
      const setting = await this.getSetting(prefsSettingName);
      
      if (!setting) {
        // Return default preferences if none exist
        return {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          marketingEmails: true,
          notificationTypes: {
            transaction: true,
            account: true,
            security: true,
            marketing: true,
            system: true,
            verification: true
          }
        };
      }
      
      return JSON.parse(setting.value);
    } catch (error) {
      console.error('Error in getNotificationPreferences:', error);
      return undefined;
    }
  }
  
  async updateNotificationPreferences(userId: number, preferences: any): Promise<any> {
    try {
      const prefsSettingName = `notification_preferences_${userId}`;
      
      // Store preferences as JSON string in settings table
      const setting = await this.createOrUpdateSetting(
        prefsSettingName,
        JSON.stringify(preferences),
        `Notification preferences for user ${userId}`
      );
      
      return preferences;
    } catch (error) {
      console.error('Error in updateNotificationPreferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }
  
  // Settings methods
  async getSetting(name: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.name, name));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
  
  async createOrUpdateSetting(
    name: string, 
    value: string, 
    description?: string
  ): Promise<Setting> {
    // Check if setting exists
    const existingSetting = await this.getSetting(name);
    
    if (existingSetting) {
      // Update existing setting
      const result = await db.update(settings)
        .set({ 
          value,
          description: description || existingSetting.description,
          updatedAt: new Date()
        })
        .where(eq(settings.name, name))
        .returning();
      
      return result[0];
    } else {
      // Create new setting
      const result = await db.insert(settings)
        .values({
          name,
          value,
          description
        })
        .returning();
      
      return result[0];
    }
  }

  // Additional admin methods implementation
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    const result = await db.select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
    return result;
  }

  async getPendingTransactionCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.status, 'pending'));
    return result[0]?.count || 0;
  }  async getTransactions(options: { 
    limit: number; 
    offset: number; 
    search?: string; 
    status?: string; 
    type?: string; 
    dateFrom?: string; 
    dateTo?: string 
  }): Promise<Transaction[]> {
    let baseQuery = db.select().from(transactions);
    const conditions = [];

    if (options.search) {
      conditions.push(like(transactions.description, `%${options.search}%`));
    }

    if (options.status) {
      conditions.push(eq(transactions.status, options.status as TransactionStatus));
    }

    if (options.type) {
      conditions.push(eq(transactions.type, options.type as TransactionType));
    }

    if (options.dateFrom && options.dateTo) {
      conditions.push(
        between(transactions.createdAt, new Date(options.dateFrom), new Date(options.dateTo))
      );
    }

    const query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const result = await query
      .orderBy(desc(transactions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return result;
  }

  async getTransactionCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(transactions);
    return result[0]?.count || 0;
  }
  async getDeposits(options: { 
    limit: number; 
    offset: number; 
    search?: string; 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string; 
    method?: string; 
    amountMin?: number; 
    amountMax?: number 
  }): Promise<Transaction[]> {
    let baseQuery = db.select().from(transactions);
    const conditions = [eq(transactions.type, 'deposit')];

    if (options.search) {
      conditions.push(like(transactions.description, `%${options.search}%`));
    }

    if (options.status) {
      conditions.push(eq(transactions.status, options.status as TransactionStatus));
    }

    if (options.method) {
      conditions.push(like(transactions.description, `%${options.method}%`));
    }

    if (options.amountMin) {
      conditions.push(sql`${transactions.amount} >= ${options.amountMin}`);
    }

    if (options.amountMax) {
      conditions.push(sql`${transactions.amount} <= ${options.amountMax}`);
    }

    if (options.dateFrom && options.dateTo) {
      conditions.push(
        between(transactions.createdAt, new Date(options.dateFrom), new Date(options.dateTo))
      );
    }

    const query = baseQuery.where(and(...conditions));

    const result = await query
      .orderBy(desc(transactions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return result;
  }

  async getDepositCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.type, 'deposit'));
    return result[0]?.count || 0;
  }

  async updateDepositStatus(id: number, status: TransactionStatus): Promise<Transaction | undefined> {
    return this.updateTransactionStatus(id, status);
  }
  async getWithdrawals(options: { 
    limit: number; 
    offset: number; 
    search?: string; 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string; 
    method?: string; 
    amountMin?: number; 
    amountMax?: number 
  }): Promise<Transaction[]> {
    let baseQuery = db.select().from(transactions);
    const conditions = [eq(transactions.type, 'withdrawal')];

    if (options.search) {
      conditions.push(like(transactions.description, `%${options.search}%`));
    }

    if (options.status) {
      conditions.push(eq(transactions.status, options.status as TransactionStatus));
    }

    if (options.method) {
      conditions.push(like(transactions.description, `%${options.method}%`));
    }

    if (options.amountMin) {
      conditions.push(sql`${transactions.amount} >= ${options.amountMin}`);
    }

    if (options.amountMax) {
      conditions.push(sql`${transactions.amount} <= ${options.amountMax}`);
    }

    if (options.dateFrom && options.dateTo) {
      conditions.push(
        between(transactions.createdAt, new Date(options.dateFrom), new Date(options.dateTo))
      );
    }

    const query = baseQuery.where(and(...conditions));

    const result = await query
      .orderBy(desc(transactions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return result;
  }

  async getWithdrawalCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.type, 'withdrawal'));
    return result[0]?.count || 0;
  }

  async updateWithdrawalStatus(id: number, status: TransactionStatus): Promise<Transaction | undefined> {
    return this.updateTransactionStatus(id, status);
  }  async getAuditLogs(options: { 
    limit: number; 
    offset: number; 
    search?: string; 
    action?: string; 
    dateFrom?: string; 
    dateTo?: string 
  }): Promise<Log[]> {
    let baseQuery = db.select().from(logs);
    const conditions = [];

    if (options.search) {
      conditions.push(like(logs.message, `%${options.search}%`));
    }

    if (options.action) {
      conditions.push(eq(logs.type, options.action as LogType));
    }

    if (options.dateFrom && options.dateTo) {
      conditions.push(
        between(logs.createdAt, new Date(options.dateFrom), new Date(options.dateTo))
      );
    }

    const query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const result = await query
      .orderBy(desc(logs.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return result;
  }

  async getAuditLogCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(logs);
    return result[0]?.count || 0;
  }

  async getAllUsersForExport(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(mapUserResult);
  }

  async getAllTransactionsForExport(): Promise<Transaction[]> {
    const result = await db.select().from(transactions);
    return result;
  }

  async getMaintenanceSettings(): Promise<Setting | undefined> {
    const result = await db.select()
      .from(settings)
      .where(eq(settings.name, 'maintenance'));
    return result.length > 0 ? result[0] : undefined;
  }

  async updateMaintenanceSettings(enabled: boolean, message?: string): Promise<Setting> {
    const maintenanceData = {
      enabled,
      message: message || 'The system is currently under maintenance. Please try again later.'
    };

    return this.createOrUpdateSetting(
      'maintenance', 
      JSON.stringify(maintenanceData), 
      'System maintenance settings'
    );
  }
}

// Refactor query result mapping
const mapUserResult = (result: any): User => ({
  id: result.id,
  username: result.username,
  password: result.password,
  email: result.email,
  firstName: result.firstName,
  lastName: result.lastName,
  role: result.role,
  balance: result.balance,
  isVerified: result.isVerified ?? null,
  isActive: result.isActive ?? null,
  createdAt: new Date(result.createdAt), // Ensure date fields are properly converted
  updatedAt: new Date(result.updatedAt),
  referredBy: result.referredBy ?? null,
  twoFactorEnabled: result.twoFactorEnabled ?? false,
  twoFactorSecret: result.twoFactorSecret ?? null,
  verificationToken: result.verificationToken ?? null,
  verificationTokenExpiry: result.verificationTokenExpiry ? new Date(result.verificationTokenExpiry) : null,
  passwordResetToken: result.passwordResetToken ?? null,
  passwordResetTokenExpiry: result.passwordResetTokenExpiry ? new Date(result.passwordResetTokenExpiry) : null,
  bitcoinAddress: result.bitcoinAddress ?? null,
  bitcoinCashAddress: result.bitcoinCashAddress ?? null,
  ethereumAddress: result.ethereumAddress ?? null,
  bnbAddress: result.bnbAddress ?? null,
  usdtTrc20Address: result.usdtTrc20Address ?? null
});