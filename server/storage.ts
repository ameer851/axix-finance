import { users, type User, type InsertUser, transactions, type Transaction, type InsertTransaction, transactionStatusEnum, roleEnum, transactionTypeEnum } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  
  // Transaction methods
  getTransaction(id: number): Promise<Transaction | undefined>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  getPendingTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: "completed" | "rejected"): Promise<Transaction | undefined>;
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

  async updateTransactionStatus(id: number, status: "completed" | "rejected"): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;

    const result = await db.update(transactions)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
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
    }

    return result.length > 0 ? result[0] : undefined;
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
}

// Export the storage instance
export const storage = new DatabaseStorage();

// Initialize the database when the app starts
initializeDatabase().catch(console.error);
