import { 
  users, type User, type InsertUser, 
  transactions, type Transaction, type InsertTransaction, 
  logs, type Log, type InsertLog,
  messages, type Message, type InsertMessage,
  settings, type Setting, type InsertSetting,
  transactionStatusEnum, roleEnum, transactionTypeEnum, logTypeEnum, messageStatusEnum,
  type TransactionStatus, type TransactionType, type LogType, type MessageStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, between, like, sql, desc, asc, isNull, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  updateUserProfile(userId: number, data: Partial<User>): Promise<User | undefined>;
  updateUserVerificationStatus(userId: number, isVerified: boolean): Promise<User | undefined>;
  updateUserActiveStatus(userId: number, isActive: boolean): Promise<User | undefined>;
  updateUser2FAStatus(userId: number, enabled: boolean, secret?: string): Promise<User | undefined>;
  getUserReferrals(referrerId: number): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  
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
  
  // Log methods
  createLog(log: InsertLog): Promise<Log>;
  getLogs(limit?: number, offset?: number): Promise<Log[]>;
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
  
  // Settings methods
  getSetting(name: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  createOrUpdateSetting(name: string, value: string, description?: string, adminId?: number): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      balance: "0",
    }).returning();
    
    return result[0];
  }

  async updateUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const newBalance = parseFloat(user.balance as string) + amount;
    
    const result = await db.update(users)
      .set({ balance: newBalance.toString() })
      .where(eq(users.id, userId))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
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
    
    return result.length > 0 ? result[0] : undefined;
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
    
    return result.length > 0 ? result[0] : undefined;
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
    
    return result.length > 0 ? result[0] : undefined;
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
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserReferrals(referrerId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.referredBy, referrerId));
  }
  
  async searchUsers(query: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(users)
      .where(
        or(
          like(users.username, searchPattern),
          like(users.email, searchPattern),
          like(users.firstName, searchPattern),
          like(users.lastName, searchPattern)
        )
      );
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

// Initialize database with admin user
async function initializeDatabase() {
  const storage = new DatabaseStorage();
  
  // Check if admin user exists
  const adminUser = await storage.getUserByUsername("admin");
  
  // If admin doesn't exist, create one
  if (!adminUser) {
    await storage.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@caraxfinance.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin"
    });
    console.log("Admin user created");
  }
  
  // Initialize default settings
  await storage.createOrUpdateSetting(
    "withdrawalThreshold", 
    "100", 
    "Minimum amount required for withdrawals"
  );
  
  await storage.createOrUpdateSetting(
    "maintenanceMode", 
    "false", 
    "System maintenance mode (true/false)"
  );
  
  await storage.createOrUpdateSetting(
    "referralCommission", 
    "0.10", 
    "Referral commission rate (e.g., 0.10 for 10%)"
  );
}

// Export the storage instance
export const storage = new DatabaseStorage();

// Initialize the database when the app starts
initializeDatabase().catch(console.error);