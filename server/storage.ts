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
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User | undefined>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  updateUserProfile(userId: number, data: Partial<User>): Promise<User | undefined>;
  updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User | undefined>;
  updateUserActiveStatus(userId: number, isActive: boolean): Promise<User | undefined>;
  updateUser2FAStatus(userId: number, enabled: boolean, secret?: string): Promise<User | undefined>;
  getUserReferrals(referrerId: number): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  // Add missing verification functions
  updateUserVerificationToken(userId: number, token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  updateUser(userId: number, data: Partial<User>): Promise<User | undefined>;
  getAdminUsers(): Promise<User[]>;
  
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
  updateTransactionStatus(id: number, status: TransactionStatus, adminId?: number, rejectionReason?: string): Promise<Transaction | undefined>;
  
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
  respondToMessage(id: number, adminId: number, response: string): Promise<Message | undefined>;
  
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
  createOrUpdateSetting(name: string, value: string, description?: string, adminId?: number): Promise<Setting>;
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
      // Check if admin user exists
      const adminUsers = await this.getAdminUsers();
      
      // Create default admin if none exists
      if (!adminUsers || adminUsers.length === 0) {
        console.log('Creating default admin user...');
        // Only provide fields allowed by InsertUser (omit id, createdAt, updatedAt, etc.)
        const defaultAdmin: InsertUser = {
          username: "admin",
          password: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123!",
          email: process.env.DEFAULT_ADMIN_EMAIL || "admin@caraxfinance.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        };
        await this.createUser(defaultAdmin);
        console.log('Default admin user created successfully');
      }
      
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
      // Creating a default admin user if database queries are failing during development
      if (process.env.NODE_ENV === 'development' && username === 'admin') {
        console.log('Returning fallback admin user for development');
        return {
          id: 1,
          username: 'admin',
          password: 'admin123',
          email: 'admin@caraxfinance.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          balance: '0',
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          referredBy: null,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          verificationToken: null,
          verificationTokenExpiry: null,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
          bitcoinAddress: null,
          bitcoinCashAddress: null,
          ethereumAddress: null,
          bnbAddress: null,
          usdtTrc20Address: null
        };
      }
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
  }

  async createUser(user: InsertUser): Promise<User | undefined> {
    const result = await db.insert(users).values(user).returning({
      id: users.id,
      username: users.username,
      password: users.password,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      balance: users.balance ?? "0",
      isVerified: users.isVerified ?? false,
      isActive: users.isActive ?? true,
      referredBy: users.referredBy ?? null,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      twoFactorEnabled: users.twoFactorEnabled ?? false,
      twoFactorSecret: users.twoFactorSecret ?? null,
      verificationToken: users.verificationToken ?? null,
      verificationTokenExpiry: users.verificationTokenExpiry ?? null,
      passwordResetToken: users.passwordResetToken ?? null,
      passwordResetTokenExpiry: users.passwordResetTokenExpiry ?? null,
      bitcoinAddress: users.bitcoinAddress ?? null,
      bitcoinCashAddress: users.bitcoinCashAddress ?? null,
      ethereumAddress: users.ethereumAddress ?? null,
      bnbAddress: users.bnbAddress ?? null,
      usdtTrc20Address: users.usdtTrc20Address ?? null
    });

    return result.length > 0 ? mapUserResult(result[0]) : undefined;
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
    } catch (error) {
      console.error('Database error in getUserByVerificationToken:', error);
      return undefined;
    }
  }
  
  async updateUser(userId: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const result = await db.update(users)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0 ? mapUserResult(result[0]) : undefined;
  }
  
  async getAdminUsers(): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.role, 'admin'));
    return result.map(mapUserResult);
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
    adminId?: number, 
    rejectionReason?: string
  ): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;

    const updateData: Record<string, any> = { 
      status, 
      updatedAt: new Date(),
      processedBy: adminId
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
        message: `Transaction #${id} (${transaction.type}) was approved`,
        userId: adminId,
        details: { transactionId: id, amount: transaction.amount }
      });
    } else if (status === "rejected") {
      // Create log entry for rejected transaction
      await this.createLog({
        type: "audit",
        message: `Transaction #${id} (${transaction.type}) was rejected`,
        userId: adminId,
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
  
  async respondToMessage(id: number, adminId: number, response: string): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;

    const result = await db.update(messages)
      .set({ 
        status: "replied",
        respondedBy: adminId,
        response,
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
        `Notification preferences for user ${userId}`,
        userId
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
    description?: string, 
    adminId?: number
  ): Promise<Setting> {
    // Check if setting exists
    const existingSetting = await this.getSetting(name);
    
    if (existingSetting) {
      // Update existing setting
      const result = await db.update(settings)
        .set({ 
          value,
          description: description || existingSetting.description,
          updatedAt: new Date(),
          updatedBy: adminId
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
          description,
          updatedBy: adminId
        })
        .returning();
      
      return result[0];
    }
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