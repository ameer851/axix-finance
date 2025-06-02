var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express4 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertLogSchema: () => insertLogSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertSettingSchema: () => insertSettingSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  logTypeEnum: () => logTypeEnum,
  logs: () => logs,
  messageStatusEnum: () => messageStatusEnum,
  messages: () => messages,
  notificationPriorityEnum: () => notificationPriorityEnum,
  notificationTypeEnum: () => notificationTypeEnum,
  notifications: () => notifications,
  roleEnum: () => roleEnum,
  settings: () => settings,
  transactionStatusEnum: () => transactionStatusEnum,
  transactionTypeEnum: () => transactionTypeEnum,
  transactions: () => transactions,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, numeric, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var roleEnum = pgEnum("role", ["user", "admin"]);
var transactionTypeEnum = pgEnum("transaction_type", ["deposit", "withdrawal", "transfer", "investment"]);
var transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "rejected"]);
var logTypeEnum = pgEnum("log_type", ["info", "warning", "error", "audit"]);
var messageStatusEnum = pgEnum("message_status", ["unread", "read", "replied"]);
var notificationTypeEnum = pgEnum("notification_type", ["transaction", "account", "security", "marketing", "system", "verification"]);
var notificationPriorityEnum = pgEnum("notification_priority", ["low", "medium", "high"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: roleEnum("role").notNull().default("user"),
  balance: numeric("balance").notNull().default("0"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  referredBy: integer("referred_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  passwordResetToken: text("password_reset_token"),
  passwordResetTokenExpiry: timestamp("password_reset_token_expiry"),
  // New wallet address fields
  bitcoinAddress: text("bitcoin_address"),
  bitcoinCashAddress: text("bitcoin_cash_address"),
  ethereumAddress: text("ethereum_address"),
  bnbAddress: text("bnb_address"),
  usdtTrc20Address: text("usdt_trc20_address")
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  status: transactionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  processedBy: integer("processed_by").references(() => users.id),
  rejectionReason: text("rejection_reason")
});
var logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  type: logTypeEnum("type").notNull(),
  message: text("message").notNull(),
  details: jsonb("details"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: text("ip_address")
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").notNull().default("unread"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  respondedBy: integer("responded_by").references(() => users.id),
  response: text("response")
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  priority: notificationPriorityEnum("priority").notNull().default("medium"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at")
});
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id)
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  balance: true,
  isVerified: true,
  isActive: true,
  twoFactorEnabled: true,
  twoFactorSecret: true,
  referredBy: true,
  bitcoinAddress: true,
  bitcoinCashAddress: true,
  ethereumAddress: true,
  bnbAddress: true,
  usdtTrc20Address: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedBy: true,
  rejectionReason: true
});
var insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  respondedBy: true,
  response: true
});
var insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
  updatedBy: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true
});

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
dotenv.config();
var DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set.");
  console.error("Please check your .env file or set the DATABASE_URL environment variable.");
  if (process.env.NODE_ENV === "development") {
    console.log("Using fallback database for development mode");
  } else {
    throw new Error("DATABASE_URL must be set. Database connection failed.");
  }
}
var pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 6e4,
  // Increased from 30000
  connectionTimeoutMillis: 6e4
  // Increased from 15000
});
pool.on("connect", (client) => {
  console.log("Connected to PostgreSQL database");
});
pool.on("error", (err) => {
  console.error("Unexpected database connection error:", err);
  if (err.code) {
    console.error(`Error code: ${err.code}`);
  }
  if (err.message) {
    console.error(`Error message: ${err.message}`);
  }
  if (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
    console.log("Database connection timed out or was refused. Will retry automatically.");
  }
});
async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("Database connection successful:", result.rows[0]);
    return true;
  } catch (err) {
    const pgError = err;
    console.error("Database connection check failed:", pgError.message);
    if (pgError.code) {
      console.error(`Error code: ${pgError.code}`);
      if (pgError.code === "ETIMEDOUT") {
        console.error("Database connection timed out. Please check if the database server is running and accessible.");
      } else if (pgError.code === "ECONNREFUSED") {
        console.error("Database connection refused. Please check if the database server is running on the specified host and port.");
      } else if (pgError.code === "28P01") {
        console.error("Invalid database credentials. Please check your username and password.");
      } else if (pgError.code === "3D000") {
        console.error("Database does not exist. Please check your database name.");
      }
    }
    return false;
  }
}
var queryClient = postgres(DATABASE_URL || "", {
  max: 10,
  idle_timeout: 60,
  // Increased from 30
  connect_timeout: 60,
  // Increased from 15
  // Add onnotice to handle database notices
  onnotice: (notice) => {
    console.log("Database notice:", notice.message);
  },
  // Add retry logic for connection attempts
  max_lifetime: 60 * 5,
  // 5 minutes max connection lifetime
  // Enhanced error handling with debug information
  debug: process.env.NODE_ENV === "development",
  transform: {
    undefined: null
    // Convert undefined values to null for better DB compatibility
  }
});
var db = drizzle(queryClient, { schema: schema_exports });
try {
  pool.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.error("Database connection error:", err.message);
      console.error("This might affect authentication and other database-dependent features.");
      if (err.message.includes("connect ECONNREFUSED")) {
        console.error("Make sure your PostgreSQL database is running on the correct port (currently set to 5000).");
      }
    } else {
      console.log("Database connection successful:", res.rows[0].now);
    }
  });
} catch (error) {
  console.error("Failed to test database connection:", error);
}

// server/storage.ts
import { eq, and, or, between, like, sql, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // Database management methods
  async checkDatabaseConnection() {
    try {
      const result = await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error("Database connection check failed:", error);
      return false;
    }
  }
  async initializeDatabase() {
    try {
      const requiredSettings = [
        { name: "minimumWithdrawal", value: "50", description: "Minimum withdrawal amount in USD" },
        { name: "withdrawalFee", value: "5", description: "Withdrawal fee percentage" },
        { name: "referralBonus", value: "10", description: "Referral bonus percentage" },
        { name: "maintenanceMode", value: "false", description: "System maintenance mode" },
        { name: "contactEmail", value: process.env.CONTACT_EMAIL || "support@caraxfinance.com", description: "Support contact email" }
      ];
      for (const setting of requiredSettings) {
        const existingSetting = await this.getSetting(setting.name);
        if (!existingSetting) {
          await this.createOrUpdateSetting(setting.name, setting.value, setting.description);
          if (process.env.NODE_ENV !== "production") console.log(`Setting '${setting.name}' initialized`);
        }
      }
      if (process.env.NODE_ENV !== "production") console.log("Database initialization completed successfully");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }
  // User methods
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? mapUserResult(result[0]) : void 0;
  }
  async getUserByUsername(username) {
    try {
      if (process.env.NODE_ENV !== "production") console.log(`Looking up user by username: ${username}`);
      const result = await db.select().from(users).where(eq(users.username, username));
      return result.length > 0 ? mapUserResult(result[0]) : void 0;
    } catch (error) {
      console.error("Database error in getUserByUsername:", error);
      return void 0;
    }
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? mapUserResult(result[0]) : void 0;
  }
  async getAllUsers() {
    const result = await db.select().from(users);
    return result.map(mapUserResult);
  }
  async createUser(user) {
    try {
      const result = await db.insert(users).values(user).returning();
      return result.length > 0 ? mapUserResult(result[0]) : void 0;
    } catch (error) {
      console.error("Error creating user:", error);
      return void 0;
    }
  }
  async updateUserBalance(userId, amount) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const newBalance = parseFloat(user.balance) + amount;
    const result = await db.update(users).set({ balance: newBalance.toString() }).where(eq(users.id, userId)).returning();
    return result.length > 0 ? mapUserResult(result[0]) : void 0;
  }
  async updateUserProfile(userId, data) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const { id, password, balance, role, createdAt, ...updateData } = data;
    const result = await db.update(users).set({
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return result.length > 0 ? mapUserResult(result[0]) : void 0;
  }
  async updateUserVerificationStatus(userId, isVerified) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const result = await db.update(users).set({
      isVerified,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return result.length > 0 ? mapUserResult(result[0]) : void 0;
  }
  async updateUserActiveStatus(userId, isActive) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const result = await db.update(users).set({
      isActive,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return result.length > 0 ? mapUserResult(result[0]) : void 0;
  }
  async updateUser2FAStatus(userId, enabled, secret) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const result = await db.update(users).set({
      twoFactorEnabled: enabled,
      twoFactorSecret: secret,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return result.length > 0 ? mapUserResult(result[0]) : void 0;
  }
  async updateUserVerificationToken(userId, token) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const result = await db.update(users).set({
      verificationToken: token,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return result.length > 0 ? mapUserResult(result[0]) : void 0;
  }
  async getUserByVerificationToken(token) {
    try {
      const result = await db.select().from(users).where(eq(users.verificationToken, token));
      return result.length > 0 ? mapUserResult(result[0]) : void 0;
    } catch (error) {
      console.error("Database error in getUserByVerificationToken:", error);
      return void 0;
    }
  }
  async getUserReferrals(referrerId) {
    const result = await db.select().from(users).where(eq(users.referredBy, referrerId));
    return result.map(mapUserResult);
  }
  async searchUsers(query) {
    const searchPattern = `%${query}%`;
    const result = await db.select().from(users).where(
      or(
        like(users.username, searchPattern),
        like(users.email, searchPattern),
        like(users.firstName, searchPattern),
        like(users.lastName, searchPattern)
      )
    );
    return result.map(mapUserResult);
  }
  async getUsers(options) {
    try {
      let conditions = [];
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
      if (options.status === "active") {
        conditions.push(eq(users.isActive, true));
      } else if (options.status === "inactive") {
        conditions.push(eq(users.isActive, false));
      } else if (options.status === "verified") {
        conditions.push(eq(users.isVerified, true));
      } else if (options.status === "unverified") {
        conditions.push(eq(users.isVerified, false));
      }
      let result;
      if (conditions.length > 0) {
        result = await db.select().from(users).where(and(...conditions)).limit(options.limit).offset(options.offset).orderBy(desc(users.createdAt));
      } else {
        result = await db.select().from(users).limit(options.limit).offset(options.offset).orderBy(desc(users.createdAt));
      }
      return result.map(mapUserResult);
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }
  async getUserCount() {
    try {
      const result = await db.select({ count: sql`count(*)` }).from(users);
      return result[0].count;
    } catch (error) {
      console.error("Error getting user count:", error);
      return 0;
    }
  }
  async updateUser(userId, data) {
    try {
      const updateData = {};
      if (data.username !== void 0) updateData.username = data.username;
      if (data.email !== void 0) updateData.email = data.email;
      if (data.firstName !== void 0) updateData.firstName = data.firstName;
      if (data.lastName !== void 0) updateData.lastName = data.lastName;
      if (data.role !== void 0) updateData.role = data.role;
      if (data.balance !== void 0) updateData.balance = data.balance;
      if (data.isVerified !== void 0) updateData.isVerified = data.isVerified;
      if (data.isActive !== void 0) updateData.isActive = data.isActive;
      if (data.twoFactorEnabled !== void 0) updateData.twoFactorEnabled = data.twoFactorEnabled;
      if (data.twoFactorSecret !== void 0) updateData.twoFactorSecret = data.twoFactorSecret;
      const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
      return result.length > 0 ? mapUserResult(result[0]) : void 0;
    } catch (error) {
      console.error("Error updating user:", error);
      return void 0;
    }
  }
  async deleteUser(userId) {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  async getActiveUserCount() {
    try {
      const result = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.isActive, true));
      return result[0].count;
    } catch (error) {
      console.error("Error getting active user count:", error);
      return 0;
    }
  }
  // Transaction methods
  async getTransaction(id) {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result.length > 0 ? result[0] : void 0;
  }
  async getUserTransactions(userId) {
    return await db.select().from(transactions).where(eq(transactions.userId, userId));
  }
  async getAllTransactions() {
    return await db.select().from(transactions);
  }
  async getPendingTransactions() {
    return await db.select().from(transactions).where(eq(transactions.status, "pending"));
  }
  async createTransaction(insertTransaction) {
    const result = await db.insert(transactions).values({
      ...insertTransaction
    }).returning();
    return result[0];
  }
  async getTransactionsByDateRange(startDate, endDate) {
    return await db.select().from(transactions).where(
      and(
        sql`${transactions.createdAt} >= ${startDate}`,
        sql`${transactions.createdAt} <= ${endDate}`
      )
    ).orderBy(desc(transactions.createdAt));
  }
  async getTransactionsByStatus(status) {
    return await db.select().from(transactions).where(eq(transactions.status, status)).orderBy(desc(transactions.createdAt));
  }
  async getTransactionsByType(type) {
    return await db.select().from(transactions).where(eq(transactions.type, type)).orderBy(desc(transactions.createdAt));
  }
  async searchTransactions(query) {
    const searchPattern = `%${query}%`;
    const queryAsNumber = parseFloat(query);
    if (!isNaN(queryAsNumber)) {
      return await db.select().from(transactions).where(
        or(
          like(transactions.description, searchPattern),
          sql`CAST(${transactions.amount} AS TEXT) LIKE ${searchPattern}`
        )
      ).orderBy(desc(transactions.createdAt));
    }
    return await db.select().from(transactions).where(like(transactions.description, searchPattern)).orderBy(desc(transactions.createdAt));
  }
  async updateTransactionStatus(id, status, rejectionReason) {
    const transaction = await this.getTransaction(id);
    if (!transaction) return void 0;
    const updateData = {
      status,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    const result = await db.update(transactions).set(updateData).where(eq(transactions.id, id)).returning();
    if (status === "completed") {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === "deposit" || transaction.type === "transfer") {
        await this.updateUserBalance(transaction.userId, amount);
      } else if (transaction.type === "withdrawal" || transaction.type === "investment") {
        await this.updateUserBalance(transaction.userId, -amount);
      }
      await this.createLog({
        type: "audit",
        message: `Transaction #${id} (${transaction.type}) was completed`,
        userId: transaction.userId,
        details: { transactionId: id, amount: transaction.amount }
      });
    } else if (status === "rejected") {
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
    return result.length > 0 ? result[0] : void 0;
  }
  // Log methods
  async createLog(log2) {
    const result = await db.insert(logs).values(log2).returning();
    return result[0];
  }
  async getLogs(limit = 100, offset = 0) {
    return await db.select().from(logs).orderBy(desc(logs.createdAt)).limit(limit).offset(offset);
  }
  async getAllLogs() {
    return await db.select().from(logs).orderBy(desc(logs.createdAt));
  }
  async getUserLogs(userId) {
    return await db.select().from(logs).where(eq(logs.userId, userId)).orderBy(desc(logs.createdAt));
  }
  async getLogsByType(type) {
    return await db.select().from(logs).where(eq(logs.type, type)).orderBy(desc(logs.createdAt));
  }
  async getLogsByDateRange(startDate, endDate) {
    return await db.select().from(logs).where(
      and(
        sql`${logs.createdAt} >= ${startDate}`,
        sql`${logs.createdAt} <= ${endDate}`
      )
    ).orderBy(desc(logs.createdAt));
  }
  async searchLogs(query) {
    const searchPattern = `%${query}%`;
    return await db.select().from(logs).where(like(logs.message, searchPattern)).orderBy(desc(logs.createdAt));
  }
  // Message methods
  async createMessage(message) {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }
  async getMessage(id) {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result.length > 0 ? result[0] : void 0;
  }
  async getUserMessages(userId) {
    return await db.select().from(messages).where(eq(messages.userId, userId)).orderBy(desc(messages.createdAt));
  }
  async getAllMessages() {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }
  async getUnreadMessages() {
    return await db.select().from(messages).where(eq(messages.status, "unread")).orderBy(desc(messages.createdAt));
  }
  async updateMessageStatus(id, status) {
    const message = await this.getMessage(id);
    if (!message) return void 0;
    const result = await db.update(messages).set({
      status,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(messages.id, id)).returning();
    return result.length > 0 ? result[0] : void 0;
  }
  // Notification methods
  async getUserNotifications(userId, options = {}) {
    try {
      const { type, priority, read, offset = 0, limit = 20 } = options;
      let query = db.select().from(notifications).where(and(
        eq(notifications.userId, userId),
        type ? eq(notifications.type, type) : sql`true`,
        priority ? eq(notifications.priority, priority) : sql`true`,
        read !== void 0 ? eq(notifications.isRead, read) : sql`true`
      ));
      let countQuery = db.select({ count: sql`COUNT(*)` }).from(notifications).where(and(
        eq(notifications.userId, userId),
        type ? eq(notifications.type, type) : sql`true`,
        priority ? eq(notifications.priority, priority) : sql`true`,
        read !== void 0 ? eq(notifications.isRead, read) : sql`true`
      ));
      const countResult = await countQuery;
      const [{ count }] = countResult;
      const queryResults = await query;
      const results = queryResults;
      return {
        notifications: results,
        total: count
      };
    } catch (error) {
      console.error("Error in getUserNotifications:", error);
      return { notifications: [], total: 0 };
    }
  }
  async getNotification(id) {
    try {
      const result = await db.select().from(notifications).where(eq(notifications.id, id));
      return result.length > 0 ? result[0] : void 0;
    } catch (error) {
      console.error("Error in getNotification:", error);
      return void 0;
    }
  }
  async createNotification(notification) {
    try {
      const result = await db.insert(notifications).values(notification).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createNotification:", error);
      throw new Error("Failed to create notification");
    }
  }
  async createBulkNotifications(notificationsData) {
    try {
      const result = await db.transaction(async (tx) => {
        const insertedNotifications = await tx.insert(notifications).values(notificationsData).returning();
        return insertedNotifications.length;
      });
      return result;
    } catch (error) {
      console.error("Error in createBulkNotifications:", error);
      throw new Error("Failed to create bulk notifications");
    }
  }
  async markNotificationAsRead(id) {
    try {
      const notification = await this.getNotification(id);
      if (!notification) return void 0;
      const result = await db.update(notifications).set({
        isRead: true
      }).where(eq(notifications.id, id)).returning();
      return result.length > 0 ? result[0] : void 0;
    } catch (error) {
      console.error("Error in markNotificationAsRead:", error);
      return void 0;
    }
  }
  async markAllNotificationsAsRead(userId) {
    try {
      const result = await db.update(notifications).set({ isRead: true }).where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      ).returning();
      return result.length;
    } catch (error) {
      console.error("Error in markAllNotificationsAsRead:", error);
      return 0;
    }
  }
  async deleteNotification(id) {
    try {
      const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteNotification:", error);
      return false;
    }
  }
  async getUnreadNotificationCount(userId) {
    try {
      const [{ count }] = await db.select({
        count: sql`count(*)`
      }).from(notifications).where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
      return count;
    } catch (error) {
      console.error("Error in getUnreadNotificationCount:", error);
      return 0;
    }
  }
  // These methods would typically use a separate table, but for simplicity 
  // we'll use the settings table to store user preferences
  async getNotificationPreferences(userId) {
    try {
      const prefsSettingName = `notification_preferences_${userId}`;
      const setting = await this.getSetting(prefsSettingName);
      if (!setting) {
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
      console.error("Error in getNotificationPreferences:", error);
      return void 0;
    }
  }
  async updateNotificationPreferences(userId, preferences) {
    try {
      const prefsSettingName = `notification_preferences_${userId}`;
      const setting = await this.createOrUpdateSetting(
        prefsSettingName,
        JSON.stringify(preferences),
        `Notification preferences for user ${userId}`
      );
      return preferences;
    } catch (error) {
      console.error("Error in updateNotificationPreferences:", error);
      throw new Error("Failed to update notification preferences");
    }
  }
  // Settings methods
  async getSetting(name) {
    const result = await db.select().from(settings).where(eq(settings.name, name));
    return result.length > 0 ? result[0] : void 0;
  }
  async getAllSettings() {
    return await db.select().from(settings);
  }
  async createOrUpdateSetting(name, value, description) {
    const existingSetting = await this.getSetting(name);
    if (existingSetting) {
      const result = await db.update(settings).set({
        value,
        description: description || existingSetting.description,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(settings.name, name)).returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values({
        name,
        value,
        description
      }).returning();
      return result[0];
    }
  }
  // Additional admin methods implementation
  async getRecentTransactions(limit = 10) {
    const result = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit);
    return result;
  }
  async getPendingTransactionCount() {
    const result = await db.select({ count: sql`count(*)` }).from(transactions).where(eq(transactions.status, "pending"));
    return result[0]?.count || 0;
  }
  async getTransactions(options) {
    let baseQuery = db.select().from(transactions);
    const conditions = [];
    if (options.search) {
      conditions.push(like(transactions.description, `%${options.search}%`));
    }
    if (options.status) {
      conditions.push(eq(transactions.status, options.status));
    }
    if (options.type) {
      conditions.push(eq(transactions.type, options.type));
    }
    if (options.dateFrom && options.dateTo) {
      conditions.push(
        between(transactions.createdAt, new Date(options.dateFrom), new Date(options.dateTo))
      );
    }
    const query = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
    const result = await query.orderBy(desc(transactions.createdAt)).limit(options.limit).offset(options.offset);
    return result;
  }
  async getTransactionCount() {
    const result = await db.select({ count: sql`count(*)` }).from(transactions);
    return result[0]?.count || 0;
  }
  async getDeposits(options) {
    let baseQuery = db.select().from(transactions);
    const conditions = [eq(transactions.type, "deposit")];
    if (options.search) {
      conditions.push(like(transactions.description, `%${options.search}%`));
    }
    if (options.status) {
      conditions.push(eq(transactions.status, options.status));
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
    const result = await query.orderBy(desc(transactions.createdAt)).limit(options.limit).offset(options.offset);
    return result;
  }
  async getDepositCount() {
    const result = await db.select({ count: sql`count(*)` }).from(transactions).where(eq(transactions.type, "deposit"));
    return result[0]?.count || 0;
  }
  async updateDepositStatus(id, status) {
    return this.updateTransactionStatus(id, status);
  }
  async getWithdrawals(options) {
    let baseQuery = db.select().from(transactions);
    const conditions = [eq(transactions.type, "withdrawal")];
    if (options.search) {
      conditions.push(like(transactions.description, `%${options.search}%`));
    }
    if (options.status) {
      conditions.push(eq(transactions.status, options.status));
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
    const result = await query.orderBy(desc(transactions.createdAt)).limit(options.limit).offset(options.offset);
    return result;
  }
  async getWithdrawalCount() {
    const result = await db.select({ count: sql`count(*)` }).from(transactions).where(eq(transactions.type, "withdrawal"));
    return result[0]?.count || 0;
  }
  async updateWithdrawalStatus(id, status) {
    return this.updateTransactionStatus(id, status);
  }
  async getAuditLogs(options) {
    let baseQuery = db.select().from(logs);
    const conditions = [];
    if (options.search) {
      conditions.push(like(logs.message, `%${options.search}%`));
    }
    if (options.action) {
      conditions.push(eq(logs.type, options.action));
    }
    if (options.dateFrom && options.dateTo) {
      conditions.push(
        between(logs.createdAt, new Date(options.dateFrom), new Date(options.dateTo))
      );
    }
    const query = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
    const result = await query.orderBy(desc(logs.createdAt)).limit(options.limit).offset(options.offset);
    return result;
  }
  async getAuditLogCount() {
    const result = await db.select({ count: sql`count(*)` }).from(logs);
    return result[0]?.count || 0;
  }
  async getAllUsersForExport() {
    const result = await db.select().from(users);
    return result.map(mapUserResult);
  }
  async getAllTransactionsForExport() {
    const result = await db.select().from(transactions);
    return result;
  }
  async getMaintenanceSettings() {
    const result = await db.select().from(settings).where(eq(settings.name, "maintenance"));
    return result.length > 0 ? result[0] : void 0;
  }
  async updateMaintenanceSettings(enabled, message) {
    const maintenanceData = {
      enabled,
      message: message || "The system is currently under maintenance. Please try again later."
    };
    return this.createOrUpdateSetting(
      "maintenance",
      JSON.stringify(maintenanceData),
      "System maintenance settings"
    );
  }
};
var mapUserResult = (result) => ({
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
  createdAt: new Date(result.createdAt),
  // Ensure date fields are properly converted
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

// server/websocketServer.ts
import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
var storage = new DatabaseStorage();
var connections = /* @__PURE__ */ new Map();
function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", (ws, userId) => {
    console.log(`WebSocket connected for user ${userId}`);
    if (!connections.has(userId)) {
      connections.set(userId, /* @__PURE__ */ new Set());
    }
    connections.get(userId)?.add(ws);
    ws.send(JSON.stringify({
      type: "system",
      data: { message: "Connected to CaraxFinance notification server" }
    }));
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message from user ${userId}:`, data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    });
    ws.on("close", () => {
      console.log(`WebSocket disconnected for user ${userId}`);
      connections.get(userId)?.delete(ws);
      if (connections.get(userId)?.size === 0) {
        connections.delete(userId);
      }
    });
    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  });
  server.on("upgrade", (request, socket, head) => {
    const { pathname, query } = parse(request.url || "", true);
    if (pathname === "/ws/notifications") {
      const userId = query.userId ? parseInt(query.userId) : null;
      if (!userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      storage.getUser(userId).then((user) => {
        if (!user) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, userId);
        });
      }).catch((error) => {
        console.error("Error verifying user for WebSocket connection:", error);
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
      });
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
    }
  });
  return wss;
}
function sendNotification(userId, notification) {
  const userConnections = connections.get(userId);
  if (!userConnections || userConnections.size === 0) {
    return false;
  }
  const message = JSON.stringify({
    type: "notification",
    data: notification
  });
  userConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
  return true;
}

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";

// server/emailService.ts
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
var storage2 = new DatabaseStorage();
var JWT_SECRET = process.env.JWT_SECRET || "carax-verification-secret";
var transporter;
var etherealAccount = null;
async function initializeEmailTransporter() {
  try {
    if (process.env.NODE_ENV === "production" && process.env.SMTP_HOST) {
      console.log("Initializing email service with Brevo SMTP...");
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        debug: true,
        // Enable debugging
        logger: true
        // Enable logging
      });
    } else if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
      console.log("Using existing Ethereal credentials from .env file...");
      etherealAccount = {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS
      };
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASS
        },
        debug: true,
        logger: true
      });
      console.log("\n===== ETHEREAL EMAIL CREDENTIALS =====");
      console.log("\u{1F4E7} Username:", process.env.ETHEREAL_USER);
      console.log("\u{1F511} Password:", process.env.ETHEREAL_PASS);
      console.log("\u{1F310} Web Interface: https://ethereal.email/login");
      console.log("Note: Use these credentials to login and view test emails");
      console.log("=======================================\n");
    } else {
      console.log("Creating new Ethereal test account...");
      const testAccount = await nodemailer.createTestAccount();
      etherealAccount = {
        user: testAccount.user,
        pass: testAccount.pass
      };
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        },
        debug: true,
        logger: true
      });
      console.log("\n===== NEW ETHEREAL EMAIL TEST ACCOUNT =====");
      console.log("\u{1F4E7} Username:", testAccount.user);
      console.log("\u{1F511} Password:", testAccount.pass);
      console.log("\u{1F310} Web Interface: https://ethereal.email/login");
      console.log("Note: Use these credentials to login and view test emails");
      console.log("=======================================\n");
    }
    transporter.verify(function(error, success) {
      if (error) {
        console.error("SMTP transporter verification failed:", error);
      } else {
        console.log("SMTP transporter ready to send messages");
      }
    });
    return transporter;
  } catch (error) {
    console.error("Failed to initialize email transporter:", error);
    throw error;
  }
}
async function getEmailTransporter() {
  if (!transporter) {
    return initializeEmailTransporter();
  }
  return transporter;
}
async function sendVerificationEmail(user, token) {
  try {
    if (!user) {
      console.error("Cannot send verification email: User object is undefined");
      return Promise.reject(new Error("Invalid user object"));
    }
    if (!user.email || typeof user.email !== "string") {
      console.error("Cannot send verification email: Email address is missing for user", user.id);
      return Promise.reject(new Error("Email address is missing"));
    }
    const email = user.email.trim();
    if (!email.includes("@") || !email.includes(".")) {
      console.error("Cannot send verification email: Invalid email format", email);
      return Promise.reject(new Error("Invalid email format"));
    }
    console.log(`Preparing to send verification email to: ${email}`);
    const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token}`;
    const message = {
      from: process.env.EMAIL_FROM || '"Carax Finance" <noreply@caraxfinance.com>',
      to: email,
      // Make sure the email is properly formatted and exists
      subject: "Verify Your Carax Finance Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Carax Finance!</h2>
          <p>Thank you for creating an account. Please verify your email address to continue.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify My Email</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #777; font-size: 12px;">Carax Finance - Secure Financial Services</p>
        </div>
      `
    };
    console.log(`Sending verification email to ${email} with token: ${token.substring(0, 10)}...`);
    const emailTransporter = await getEmailTransporter();
    const info = await emailTransporter.sendMail(message);
    if (process.env.NODE_ENV !== "production") {
      console.log("\n===== VERIFICATION EMAIL SENT SUCCESSFULLY =====");
      console.log("\u{1F4E7} Message ID:", info.messageId);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("\u{1F517} PREVIEW URL:", previewUrl);
        console.log("\u{1F446} Use the Ethereal credentials to view this email at the URL above");
      }
      console.log("\n\u2705 VERIFICATION INFO (FOR DEVELOPMENT TESTING):");
      console.log("Token:", token);
      console.log("Verification URL:", verificationUrl);
      console.log("\n\u{1F4A1} TIP: You can also use the development endpoint to manually verify users:");
      console.log(`GET /dev/verify-user/${email}`);
      console.log("=================================================\n");
    }
    await storage2.createLog({
      type: "info",
      userId: user.id,
      message: "Verification email sent",
      details: { emailId: info.messageId }
    });
    return Promise.resolve();
  } catch (error) {
    console.error("Failed to send verification email:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    } else {
      console.error("Error details:", error);
    }
    if (user && user.id) {
      await storage2.createLog({
        type: "error",
        userId: user.id,
        message: "Failed to send verification email",
        details: { error: error instanceof Error ? error.message : String(error) }
      }).catch((e) => console.error("Failed to log email error:", e));
    }
    return Promise.reject(error);
  }
}

// server/auth.ts
import jwt2 from "jsonwebtoken";
var storage3 = new DatabaseStorage();
var TOKEN_EXPIRY = 24 * 60 * 60 * 1e3;
var JWT_SECRET2 = process.env.JWT_SECRET || "carax-finance-verification-secret";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function generateEmailVerificationToken(userId, email) {
  const token = jwt2.sign(
    {
      userId,
      email,
      purpose: "email-verification"
    },
    JWT_SECRET2,
    { expiresIn: "24h" }
  );
  return token;
}
async function saveVerificationToken(userId, token) {
  try {
    const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);
    await storage3.updateUser(userId, {
      verificationToken: token,
      verificationTokenExpiry: tokenExpiry
    });
    return true;
  } catch (error) {
    console.error("Error saving verification token:", error);
    return false;
  }
}
async function verifyUserEmail(token) {
  try {
    const decoded = jwt2.verify(token, JWT_SECRET2);
    const user = await storage3.getUserByVerificationToken(token);
    if (!user) {
      return null;
    }
    if (user.id !== decoded.userId) {
      return null;
    }
    const tokenExpiry = user.verificationTokenExpiry;
    if (!tokenExpiry || /* @__PURE__ */ new Date() > tokenExpiry) {
      return null;
    }
    const updatedUser = await storage3.updateUser(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null
    });
    if (!updatedUser) {
      return null;
    }
    await storage3.createLog({
      type: "info",
      userId: user.id,
      message: "Email verified"
    });
    return { user: updatedUser };
  } catch (error) {
    console.error("Error verifying email:", error);
    return null;
  }
}
async function resendVerificationEmail(userId) {
  try {
    const user = await storage3.getUser(userId);
    if (!user || user.isVerified) {
      return false;
    }
    const token = generateEmailVerificationToken(userId, user.email);
    await saveVerificationToken(userId, token);
    await sendVerificationEmail(user, token);
    return true;
  } catch (error) {
    console.error("Error resending verification email:", error);
    return false;
  }
}
function requireEmailVerification(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  const user = req.user;
  if (!user.isVerified) {
    return res.status(403).json({
      message: "Email verification required",
      verificationRequired: true
    });
  }
  next();
}
function requireAdminRole(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  const user = req.user;
  if (!user.isVerified) {
    return res.status(403).json({
      message: "Email verification required",
      verificationRequired: true
    });
  }
  if (user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
      requiredRole: "admin",
      currentRole: user.role
    });
  }
  next();
}
function setupAuth(app2) {
  let store;
  if (process.env.NODE_ENV === "production") {
    const PostgresSessionStore = connectPg(session);
    try {
      store = new PostgresSessionStore({
        pool,
        tableName: "session",
        createTableIfMissing: true
      });
    } catch (error) {
      console.error("Failed to create PostgreSQL session store:", error);
      const MemoryStoreSession = MemoryStore(session);
      store = new MemoryStoreSession({
        checkPeriod: 864e5
        // prune expired entries every 24h
      });
    }
  } else {
    const MemoryStoreSession = MemoryStore(session);
    store = new MemoryStoreSession({
      checkPeriod: 864e5
      // prune expired entries every 24h
    });
  }
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "carax-finance-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1e3 * 60 * 60 * 24
      // 1 day
    },
    store
  };
  app2.set("trust proxy", 1);
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        const user = await storage3.getUserByUsername(username);
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        let passwordMatches = false;
        try {
          passwordMatches = user.password === password;
          if (!passwordMatches && user.password.includes(".")) {
            passwordMatches = await comparePasswords(password, user.password);
          }
        } catch (error) {
          console.error("Password comparison error:", error);
          passwordMatches = false;
        }
        if (!passwordMatches) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        if (!user.isActive) {
          console.log(`Inactive account: ${username}`);
          return done(null, false, { message: "Account is inactive" });
        }
        console.log(`Successful login for: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(null, false, { message: "An error occurred during login. Please try again." });
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage3.getUser(id);
      if (!user) return done(null, false);
      const { password, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage3.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage3.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage3.createUser({
        ...req.body,
        password: hashedPassword,
        role: "user",
        balance: "0",
        isActive: true,
        isVerified: false,
        twoFactorEnabled: false,
        referredBy: req.body.referredBy || null
      });
      if (!user) {
        return res.status(500).json({ message: "Failed to create user account" });
      }
      await storage3.createLog({
        type: "info",
        userId: user.id,
        message: "User account created"
      });
      const token = generateEmailVerificationToken(user.id, user.email);
      await saveVerificationToken(user.id, token);
      await sendVerificationEmail(user, token);
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          ...userWithoutPassword,
          message: "Please check your email to verify your account"
        });
      });
    } catch (error) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });
  app2.get("/api/verify-email/:token", async (req, res) => {
    const { token } = req.params;
    try {
      const result = await verifyUserEmail(token);
      if (result) {
        if (req.isAuthenticated()) {
          const user = await storage3.getUser(req.user.id);
          if (user) {
            const { password, ...userWithoutPassword } = user;
            req.login(userWithoutPassword, () => {
            });
          }
        }
        return res.status(200).json({
          success: true,
          message: "Email verified successfully"
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token"
        });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while verifying your email"
      });
    }
  });
  app2.post("/api/resend-verification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userId = req.user.id;
    try {
      const success = await resendVerificationEmail(userId);
      if (success) {
        return res.status(200).json({
          success: true,
          message: "Verification email sent"
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Could not send verification email"
        });
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while sending verification email"
      });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET");
    return res.status(200).json({ status: "ok", serverTime: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/login", async (req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    try {
      console.log("Login attempt received for:", req.body?.username);
      if (global.dbConnectionIssues) {
        console.warn("Login attempt during database connection issues");
        return res.status(503).json({
          message: "Unable to connect to the server. Please try again later.",
          error: "database_connection_issue"
        });
      }
      if (!req.body?.username || !req.body?.password) {
        return res.status(400).json({
          message: "Username and password are required",
          error: "missing_credentials"
        });
      }
      const loginTimeout = setTimeout(() => {
        console.error("Login request timed out for user:", req.body.username);
        return res.status(504).json({
          message: "Login request timed out. Please try again later.",
          error: "request_timeout"
        });
      }, 15e3);
      passport.authenticate("local", (err, user, info) => {
        clearTimeout(loginTimeout);
        if (err) {
          console.error("Login error for user:", req.body.username, err);
          return res.status(500).json({
            message: "An error occurred during login. Please try again.",
            error: "authentication_error"
          });
        }
        if (!user) {
          console.log("Authentication failed for user:", req.body.username);
          return res.status(401).json({
            message: info?.message || "Authentication failed. Please check your credentials.",
            error: "invalid_credentials"
          });
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Session creation error for user:", req.body.username, loginErr);
            return res.status(500).json({
              message: "Failed to create session. Please try again.",
              error: "session_error"
            });
          }
          console.log("Login successful for user:", req.body.username);
          storage3.createLog({
            type: "info",
            userId: user.id,
            message: "User logged in",
            details: { ip: req.ip }
          }).catch((error) => {
            console.error("Failed to create login log:", error);
          });
          const { password, ...userWithoutPassword } = user;
          if (!req.session.cookie.maxAge) {
            req.session.cookie.maxAge = 24 * 60 * 60 * 1e3;
          }
          req.session.save((err2) => {
            if (err2) {
              console.error("Session save error:", err2);
            }
            return res.json(userWithoutPassword);
          });
        });
      })(req, res, next);
    } catch (error) {
      console.error("Unexpected error during login:", error);
      return res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
        error: "unexpected_error"
      });
    }
  });
  app2.post("/api/logout", (req, res) => {
    if (req.user) {
      const userId = req.user.id;
      storage3.createLog({
        type: "info",
        userId,
        message: "User logged out"
      }).catch(console.error);
    }
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}

// server/routes.ts
import express2 from "express";

// server/notificationRoutes.ts
import express from "express";
import { z } from "zod";
var storage4 = new DatabaseStorage();
var router = express.Router();
router.get("/", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const type = req.query.type;
    const priority = req.query.priority;
    const read = req.query.read ? req.query.read === "true" : void 0;
    const { notifications: notifications2, total } = await storage4.getUserNotifications(userId, {
      type,
      priority,
      read,
      offset,
      limit
    });
    const unreadCount = await storage4.getUnreadNotificationCount(userId);
    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({
      notifications: notifications2,
      total,
      unreadCount,
      page,
      totalPages
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});
router.get("/unread-count", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const count = await storage4.getUnreadNotificationCount(userId);
    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return res.status(500).json({ message: "Failed to fetch unread notification count" });
  }
});
router.patch("/:id/read", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    const notification = await storage4.getNotification(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.userId !== userId) {
      return res.status(403).json({ message: "You do not have permission to access this notification" });
    }
    const updatedNotification = await storage4.markNotificationAsRead(notificationId);
    return res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
});
router.patch("/mark-all-read", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const count = await storage4.markAllNotificationsAsRead(userId);
    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});
router.delete("/:id", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    const notification = await storage4.getNotification(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.userId !== userId) {
      return res.status(403).json({ message: "You do not have permission to delete this notification" });
    }
    await storage4.deleteNotification(notificationId);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});
router.get("/preferences", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const preferences = await storage4.getNotificationPreferences(userId);
    if (!preferences) {
      return res.status(200).json({
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        marketingEmails: false,
        notificationTypes: {
          transaction: true,
          account: true,
          security: true,
          marketing: false,
          system: true,
          verification: true
        }
      });
    }
    return res.status(200).json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return res.status(500).json({ message: "Failed to fetch notification preferences" });
  }
});
router.patch("/preferences", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const schema = z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      notificationTypes: z.record(z.boolean()).optional()
    });
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid preference data",
        errors: validationResult.error.errors
      });
    }
    const preferences = validationResult.data;
    const updatedPreferences = await storage4.updateNotificationPreferences(userId, preferences);
    return res.status(200).json(updatedPreferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return res.status(500).json({ message: "Failed to update notification preferences" });
  }
});
var notificationRoutes_default = router;

// server/routes.ts
var storage5 = new DatabaseStorage();
var router2 = express2.Router();
function convertToCSV(data) {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");
  const csvRows = data.map(
    (row) => headers.map((header) => {
      const value = row[header];
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",")
  );
  return [csvHeaders, ...csvRows].join("\n");
}
var isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized: Login required" });
  }
  next();
};
router2.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }
    const verificationResult = await verifyUserEmail(token);
    if (!verificationResult || !verificationResult.user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }
    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: verificationResult.user.id,
        username: verificationResult.user.username,
        email: verificationResult.user.email,
        isVerified: verificationResult.user.isVerified
      }
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Failed to verify email" });
  }
});
router2.post("/resend-verification", isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const user = await storage5.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    await resendVerificationEmail(userId);
    return res.status(200).json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ message: "Failed to resend verification email" });
  }
});
if (process.env.NODE_ENV !== "production") {
  router2.get("/dev/verify-user/:email", async (req, res) => {
    try {
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage5.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }
      const updatedUser = await storage5.updateUser(user.id, {
        isVerified: true,
        verificationToken: null
      });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user verification status" });
      }
      if (process.env.NODE_ENV !== "production") console.log(`\u{1F527} Development mode: User ${email} has been manually verified`);
      return res.status(200).json({
        message: "User verified successfully (DEVELOPMENT MODE ONLY)",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          isVerified: updatedUser.isVerified
        }
      });
    } catch (error) {
      console.error("Dev verification error:", error);
      return res.status(500).json({ message: "Failed to manually verify user" });
    }
  });
}
router2.get("/profile", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const user = await storage5.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Failed to get user profile" });
  }
});
router2.put("/profile", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const { firstName, lastName, username } = req.body;
    if (username && username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters long" });
    }
    if (username) {
      const existingUser = await storage5.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }
    const updatedUser = await storage5.updateUser(userId, {
      firstName,
      lastName,
      username
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to update user profile" });
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
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update user profile" });
  }
});
router2.get("/users/:userId/balance", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = parseInt(req.params.userId, 10);
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await storage5.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const balance = parseFloat(user.balance);
    return res.status(200).json({
      availableBalance: balance,
      pendingBalance: 0,
      // TODO: Calculate from pending transactions
      totalBalance: balance,
      lastUpdated: user.updatedAt || /* @__PURE__ */ new Date()
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return res.status(500).json({ message: "Failed to get user balance" });
  }
});
router2.post("/change-password", requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }
    const user = await storage5.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    const hashedPassword = await hashPassword(newPassword);
    await storage5.updateUser(userId, {
      password: hashedPassword
    });
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
});
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.use("/api", router2);
  app2.use("/api/notifications", notificationRoutes_default);
  app2.get("/api/admin/stats", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const totalUsers = await storage5.getUserCount();
      const activeUsers = await storage5.getActiveUserCount();
      const recentTransactions = await storage5.getRecentTransactions(10);
      const pendingTransactions = await storage5.getPendingTransactionCount();
      const deposits = recentTransactions.filter((t) => t.type === "deposit");
      const withdrawals = recentTransactions.filter((t) => t.type === "withdrawal");
      const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalWithdrawals = withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const stats = {
        totalUsers,
        activeUsers,
        totalDeposits,
        totalWithdrawals,
        pendingTransactions,
        maintenanceMode: false
        // This could be stored in a settings table
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });
  app2.get("/api/admin/users", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const users2 = await storage5.getUsers({
        limit: Number(limit),
        offset,
        search,
        status
      });
      const totalUsers = await storage5.getUserCount();
      res.json({
        users: users2.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          balance: user.balance,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })),
        totalPages: Math.ceil(totalUsers / Number(limit)),
        currentPage: Number(page),
        totalUsers
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.put("/api/admin/users/:id", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      delete updates.password;
      const updatedUser = await storage5.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
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
        balance: updatedUser.balance,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.delete("/api/admin/users/:id", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const deleted = await storage5.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage5.createLog({
        type: "warning",
        userId: req.user.id,
        message: `Admin deleted user ${userId}`,
        details: { targetUserId: userId }
      });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.post("/api/admin/users/:id/fund", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, description } = req.body;
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Valid positive amount is required" });
      }
      if (amount > 1e6) {
        return res.status(400).json({ message: "Amount cannot exceed $1,000,000" });
      }
      const user = await storage5.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage5.updateUserBalance(userId, amount);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user balance" });
      }
      await storage5.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        status: "completed",
        description: description || `Admin funding by ${req.user.firstName} ${req.user.lastName}`
      });
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
        message: `Admin funded user account: $${amount} added to user ${userId}`,
        details: {
          targetUserId: userId,
          amount,
          description,
          previousBalance: parseFloat(user.balance),
          newBalance: parseFloat(user.balance) + amount
        }
      });
      await storage5.createNotification({
        userId,
        type: "account",
        title: "Account Funded",
        message: `Your account has been funded with $${amount.toLocaleString()} by administration.`,
        relatedEntityType: "transaction",
        relatedEntityId: userId
      });
      sendNotification(userId, {
        type: "balance_update",
        title: "Account Funded",
        message: `Your account has been funded with $${amount.toLocaleString()}`,
        newBalance: parseFloat(user.balance) + amount,
        amount,
        priority: "high"
      });
      res.json({
        message: "User account funded successfully",
        newBalance: parseFloat(user.balance) + amount,
        amount
      });
    } catch (error) {
      console.error("Error funding user account:", error);
      res.status(500).json({ message: "Failed to fund user account" });
    }
  });
  app2.get("/api/admin/transactions", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { page = 1, limit = 10, type, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const transactions2 = await storage5.getTransactions({
        limit: Number(limit),
        offset,
        type,
        status
      });
      const totalTransactions = await storage5.getTransactionCount();
      res.json({
        transactions: transactions2,
        totalPages: Math.ceil(totalTransactions / Number(limit)),
        currentPage: Number(page),
        totalTransactions
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.put("/api/admin/transactions/:id/status", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { status, reason } = req.body;
      const updatedTransaction = await storage5.updateTransactionStatus(transactionId, status, reason);
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
        message: `Admin updated transaction ${transactionId} status to ${status}`,
        details: { transactionId, newStatus: status, reason }
      });
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });
  app2.get("/api/admin/deposits", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const deposits = await storage5.getDeposits({
        limit: Number(limit),
        offset,
        status,
        search
      });
      const totalDeposits = await storage5.getDepositCount();
      res.json({
        deposits,
        totalPages: Math.ceil(totalDeposits / Number(limit)),
        currentPage: Number(page),
        totalDeposits
      });
    } catch (error) {
      console.error("Error fetching deposits:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });
  app2.put("/api/admin/deposits/:id/status", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id);
      const { status, reason } = req.body;
      const updatedDeposit = await storage5.updateDepositStatus(depositId, status);
      if (!updatedDeposit) {
        return res.status(404).json({ message: "Deposit not found" });
      }
      if (status === "confirmed") {
        await storage5.updateUserBalance(updatedDeposit.userId, parseFloat(updatedDeposit.amount));
      }
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
        message: `Admin ${status} deposit ${depositId}${reason ? ` - Reason: ${reason}` : ""}`,
        details: { depositId, newStatus: status, reason, amount: updatedDeposit.amount }
      });
      res.json(updatedDeposit);
    } catch (error) {
      console.error("Error updating deposit status:", error);
      res.status(500).json({ message: "Failed to update deposit status" });
    }
  });
  app2.get("/api/admin/withdrawals", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const withdrawals = await storage5.getWithdrawals({
        limit: Number(limit),
        offset,
        status,
        search
      });
      const totalWithdrawals = await storage5.getWithdrawalCount();
      res.json({
        withdrawals,
        totalPages: Math.ceil(totalWithdrawals / Number(limit)),
        currentPage: Number(page),
        totalWithdrawals
      });
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });
  app2.put("/api/admin/withdrawals/:id/status", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const { status, reason } = req.body;
      const updatedWithdrawal = await storage5.updateWithdrawalStatus(withdrawalId, status);
      if (!updatedWithdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
        message: `Admin ${status} withdrawal ${withdrawalId}`,
        details: { withdrawalId, newStatus: status, reason, amount: updatedWithdrawal.amount }
      });
      res.json(updatedWithdrawal);
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      res.status(500).json({ message: "Failed to update withdrawal status" });
    }
  });
  app2.post("/api/admin/users/bulk-update", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { userIds, updates } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "User IDs array is required" });
      }
      const results = [];
      for (const userId of userIds) {
        try {
          const updatedUser = await storage5.updateUser(userId, updates);
          if (updatedUser) {
            results.push({ userId, success: true, user: updatedUser });
          } else {
            results.push({ userId, success: false, error: "User not found" });
          }
        } catch (error) {
          results.push({ userId, success: false, error: "Update failed" });
        }
      }
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
        message: `Admin performed bulk update on ${userIds.length} users`,
        details: { userIds, updates, results: results.map((r) => ({ userId: r.userId, success: r.success })) }
      });
      res.json({ results });
    } catch (error) {
      console.error("Error performing bulk update:", error);
      res.status(500).json({ message: "Failed to perform bulk update" });
    }
  });
  app2.post("/api/admin/transactions/bulk-update", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { transactionIds, status, reason } = req.body;
      if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
        return res.status(400).json({ message: "Transaction IDs array is required" });
      }
      const results = [];
      for (const transactionId of transactionIds) {
        try {
          const updatedTransaction = await storage5.updateTransactionStatus(transactionId, status, reason);
          if (updatedTransaction) {
            results.push({ transactionId, success: true, transaction: updatedTransaction });
          } else {
            results.push({ transactionId, success: false, error: "Transaction not found" });
          }
        } catch (error) {
          results.push({ transactionId, success: false, error: "Update failed" });
        }
      }
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
        message: `Admin performed bulk status update on ${transactionIds.length} transactions`,
        details: { transactionIds, newStatus: status, reason, results: results.map((r) => ({ transactionId: r.transactionId, success: r.success })) }
      });
      res.json({ results });
    } catch (error) {
      console.error("Error performing bulk transaction update:", error);
      res.status(500).json({ message: "Failed to perform bulk transaction update" });
    }
  });
  app2.get("/api/admin/audit-logs", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { page = 1, limit = 50, userId, type, dateFrom, dateTo } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const logs2 = await storage5.getAuditLogs({
        limit: Number(limit),
        offset,
        search: userId ? `user:${userId}` : void 0,
        action: type,
        dateFrom,
        dateTo
      });
      const totalLogs = await storage5.getAuditLogCount();
      res.json({
        logs: logs2,
        totalPages: Math.ceil(totalLogs / Number(limit)),
        currentPage: Number(page),
        totalLogs
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  app2.get("/api/admin/export/users", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { format = "csv" } = req.query;
      const users2 = await storage5.getAllUsersForExport();
      if (format === "csv") {
        const csv = convertToCSV(users2);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
        res.send(csv);
      } else {
        res.json(users2);
      }
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
        message: `Admin exported users data as ${format}`,
        details: { format, recordCount: users2.length }
      });
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Failed to export users" });
    }
  });
  app2.get("/api/admin/export/transactions", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const { format = "csv", dateFrom, dateTo } = req.query;
      const transactions2 = await storage5.getAllTransactionsForExport();
      if (format === "csv") {
        const csv = convertToCSV(transactions2);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="transactions.csv"');
        res.send(csv);
      } else {
        res.json(transactions2);
      }
      await storage5.createLog({
        type: "info",
        userId: req.user.id,
        message: `Admin exported transactions data as ${format}`,
        details: { format, recordCount: transactions2.length, dateFrom, dateTo }
      });
    } catch (error) {
      console.error("Error exporting transactions:", error);
      res.status(500).json({ message: "Failed to export transactions" });
    }
  });
  app2.get("/api/admin/maintenance", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const maintenanceSettings = await storage5.getMaintenanceSettings();
      res.json(maintenanceSettings);
    } catch (error) {
      console.error("Error fetching maintenance settings:", error);
      res.status(500).json({ message: "Failed to fetch maintenance settings" });
    }
  });
  app2.put("/api/admin/maintenance", isAuthenticated, requireAdminRole, async (req, res) => {
    try {
      const settings2 = req.body;
      const updatedSettings = await storage5.updateMaintenanceSettings(settings2);
      await storage5.createLog({
        type: "warning",
        userId: req.user.id,
        message: `Admin updated maintenance settings`,
        details: { settings: settings2 }
      });
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating maintenance settings:", error);
      res.status(500).json({ message: "Failed to update maintenance settings" });
    }
  });
  app2.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const transactions2 = await storage5.getUserTransactions(userId);
      res.status(200).json(transactions2);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.get("/api/transactions/pending", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const transactions2 = await storage5.getUserTransactions(userId);
      const pendingTransactions = transactions2.filter((t) => t.status === "pending");
      res.status(200).json(pendingTransactions);
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
      res.status(500).json({ message: "Failed to fetch pending transactions" });
    }
  });
  app2.get("/api/transactions/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (req.user?.id !== userId) {
        return res.status(403).json({ message: "You do not have permission to view these transactions" });
      }
      const transactions2 = await storage5.getUserTransactions(userId);
      res.status(200).json(transactions2);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings2 = await storage5.getAllSettings();
      res.status(200).json(settings2);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.get("/api/settings/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const setting = await storage5.getSetting(name);
      if (!setting) {
        return res.status(404).json({ message: `Setting "${name}" not found` });
      }
      res.status(200).json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });
  app2.get("/api/health", async (req, res) => {
    try {
      const client = await pool.connect();
      try {
        await client.query("SELECT 1");
        res.status(200).json({
          status: "ok",
          message: "Server is running",
          databaseConnected: true
        });
      } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({
          status: "error",
          message: "Server is running but database query failed",
          databaseConnected: false
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Database connection error:", error);
      res.status(500).json({
        status: "error",
        message: "Server is running but database connection failed",
        databaseConnected: false
      });
    }
  });
  if (process.env.NODE_ENV === "development") {
    app2.get("/api/debug/tables", async (req, res) => {
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
            tables: result.rows.map((row) => row.table_name)
          });
        } catch (error) {
          console.error("Error listing tables:", error);
          res.status(500).json({ error: "Failed to list tables" });
        } finally {
          client.release();
        }
      } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ error: "Database connection failed" });
      }
    });
  }
  app2.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
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
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage5.getUserByEmail(email);
      if (user) {
        if (process.env.NODE_ENV !== "production") console.log(`Password reset requested for ${email}`);
      }
      return res.status(200).json({ message: "If this email is associated with an account, you will receive password reset instructions." });
    } catch (error) {
      console.error("Error in forgot-password:", error);
      return res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
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
  const httpServer = createServer(app2);
  setupWebSocketServer(httpServer);
  return httpServer;
}

// server/vite.ts
import express3 from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    configFile: false,
    root: path.resolve(__dirname, "..", "client"),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "..", "client", "src"),
        "@shared": path.resolve(__dirname, "..", "shared"),
        "@assets": path.resolve(__dirname, "..", "attached_assets")
      }
    },
    plugins: [
      react()
    ],
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express3.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
var storage6 = new DatabaseStorage();
var app = express4();
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production",
  crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
  crossOriginOpenerPolicy: process.env.NODE_ENV === "production",
  crossOriginResourcePolicy: process.env.NODE_ENV === "production"
}));
app.use(cors({
  origin: process.env.NODE_ENV !== "production" ? "http://localhost:4000" : process.env.CORS_ORIGIN || "https://your-production-domain.com",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
}));
app.use(express4.json({ limit: "1mb" }));
app.use(express4.urlencoded({ extended: false }));
var apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/", apiLimiter);
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const originalJson = res.json;
  const originalSend = res.send;
  res.json = function(body) {
    res.json = originalJson;
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path2.startsWith("/api")) {
        const logData = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          method: req.method,
          path: path2,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip,
          userId: req.user?.id || "anonymous"
        };
        if (process.env.NODE_ENV !== "production") {
          let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
          if (logLine.length > 80) logLine = logLine.slice(0, 79) + "\u2026";
          log(logLine);
        } else {
          if (res.statusCode >= 400 || path2.includes("/auth/")) {
            storage6.createLog({
              type: res.statusCode >= 400 ? "error" : "info",
              message: `${req.method} ${path2} ${res.statusCode}`,
              details: logData,
              userId: req.user?.id,
              ipAddress: ip
            }).catch((err) => console.error("Failed to log to database:", err));
          }
          if (process.env.NODE_ENV !== "production") console.log(JSON.stringify(logData));
        }
      }
    });
    return originalJson.call(this, body);
  };
  res.send = function(body) {
    res.send = originalSend;
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path2.startsWith("/api")) {
        if (process.env.NODE_ENV !== "production") {
          let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
          if (logLine.length > 80) logLine = logLine.slice(0, 79) + "\u2026";
          log(logLine);
        } else {
          if (process.env.NODE_ENV !== "production") console.log(JSON.stringify({
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            method: req.method,
            path: path2,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip,
            userId: req.user?.id || "anonymous"
          }));
        }
      }
    });
    return originalSend.call(this, body);
  };
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const logData = {
      error: err.name || "Error",
      message: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : void 0,
      path: req.path,
      method: req.method,
      status,
      ip,
      userId: req.user?.id || "anonymous",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.error("Server error:", JSON.stringify(logData));
    if (process.env.NODE_ENV === "production" && status >= 500) {
      storage6.createLog({
        type: "error",
        message: `${err.name || "Error"}: ${err.message}`,
        details: logData,
        userId: req.user?.id,
        ipAddress: ip
      }).catch((err2) => console.error("Failed to log error to database:", err2));
    }
    if (!res.headersSent) {
      const clientMessage = process.env.NODE_ENV === "production" && status >= 500 ? "An unexpected error occurred. Our team has been notified." : message;
      res.status(status).json({
        message: clientMessage,
        requestId: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        status
      });
    }
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 5e3;
  const host = process.env.HOST || "0.0.0.0";
  try {
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.warn("\u26A0\uFE0F Database connection issues detected. Server will start but some features may be limited.");
      global.dbConnectionIssues = true;
    }
    server.listen({
      port,
      host,
      reusePort: true
    }, () => {
      if (process.env.NODE_ENV !== "production") console.log(`\u{1F680} Server running in ${process.env.NODE_ENV || "development"} mode`);
      if (process.env.NODE_ENV !== "production") console.log(`\u{1F517} http://localhost:${port}`);
      if (dbConnected) {
        if (process.env.NODE_ENV !== "production") console.log("\u{1F4CA} Database connection established");
        if (process.env.NODE_ENV === "production") {
          storage6.initializeDatabase().catch((err) => {
            console.error("Failed to initialize database:", err);
          });
        }
      } else {
        if (process.env.NODE_ENV !== "production") console.log("\u26A0\uFE0F Running with limited functionality due to database connection issues");
        if (process.env.NODE_ENV !== "production") console.log("\u26A0\uFE0F The application will automatically retry connecting to the database");
      }
      const dbCheckInterval = setInterval(async () => {
        const reconnected = await checkDatabaseConnection();
        if (reconnected && global.dbConnectionIssues) {
          if (process.env.NODE_ENV !== "production") console.log("\u2705 Database connection re-established");
          global.dbConnectionIssues = false;
          if (process.env.NODE_ENV === "production") {
            storage6.initializeDatabase().catch((err) => {
              console.error("Failed to initialize database:", err);
            });
          }
        } else if (!reconnected && !global.dbConnectionIssues) {
          console.error("\u274C Lost connection to database");
          global.dbConnectionIssues = true;
        }
      }, 3e4);
      process.on("SIGTERM", () => {
        clearInterval(dbCheckInterval);
        server.close();
      });
      process.on("SIGINT", () => {
        clearInterval(dbCheckInterval);
        server.close();
      });
    });
  } catch (err) {
    console.error("Failed to check database connection:", err);
    console.warn("\u26A0\uFE0F Starting server without database connection check");
    server.listen({
      port,
      host,
      reusePort: true
    }, () => {
      if (process.env.NODE_ENV !== "production") console.log(`\u{1F680} Server running in ${process.env.NODE_ENV || "development"} mode`);
      if (process.env.NODE_ENV !== "production") console.log(`\u{1F517} http://localhost:${port}`);
      if (process.env.NODE_ENV !== "production") console.log("\u26A0\uFE0F Running with limited functionality due to database connection issues");
    });
  }
})().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
