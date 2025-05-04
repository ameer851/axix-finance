import { users, type User, type InsertUser, transactions, type Transaction, type InsertTransaction, transactionStatusEnum, roleEnum, transactionTypeEnum } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  userCurrentId: number;
  transactionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.userCurrentId = 1;
    this.transactionCurrentId = 1;

    // Add an admin user by default
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@caraxfinance.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      balance: "0", 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const newBalance = parseFloat(user.balance as string) + amount;
    const updatedUser: User = {
      ...user,
      balance: newBalance.toString()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId,
    );
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.status === "pending",
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionCurrentId++;
    const now = new Date();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: number, status: "completed" | "rejected"): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;

    const updatedTransaction: Transaction = {
      ...transaction,
      status,
      updatedAt: new Date(),
    };
    this.transactions.set(id, updatedTransaction);

    // If the transaction is completed, update user balance
    if (status === "completed") {
      const amount = parseFloat(transaction.amount as string);
      if (transaction.type === "deposit" || transaction.type === "transfer") {
        await this.updateUserBalance(transaction.userId, amount);
      } else if (transaction.type === "withdrawal" || transaction.type === "investment") {
        await this.updateUserBalance(transaction.userId, -amount);
      }
    }

    return updatedTransaction;
  }
}

export const storage = new MemStorage();
