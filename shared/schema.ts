import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "withdrawal",
  "transfer",
  "investment",
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "rejected",
]);
export const logTypeEnum = pgEnum("log_type", [
  "info",
  "warning",
  "error",
  "audit",
]);
export const messageStatusEnum = pgEnum("message_status", [
  "unread",
  "read",
  "replied",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "transaction",
  "account",
  "security",
  "marketing",
  "system",
  "verification",
]);
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium",
  "high",
]);

// Users table - matches the actual database structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: uuid("uid").notNull().unique(), // Auth user ID from Supabase Auth (uuid)
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  password: text("password"),
  firstName: text("firstName"),
  lastName: text("lastName"),
  full_name: text("full_name"),
  balance: text("balance").default("0"),
  // Sum of principal currently locked in active investments (not available for withdrawal)
  activeDeposits: text("active_deposits").default("0"),
  role: text("role").notNull().default("user"),
  is_admin: boolean("is_admin").default(false),
  isVerified: boolean("isVerified").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  passwordResetToken: text("passwordResetToken"),
  passwordResetTokenExpiry: timestamp("passwordResetTokenExpiry"),
  // Additional fields for auth system
  verificationToken: text("verificationToken"),
  verificationTokenExpiry: timestamp("verificationTokenExpiry"),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  twoFactorSecret: text("twoFactorSecret"),
  referredBy: integer("referredBy"),
  pendingEmail: text("pendingEmail"),
  // Wallet addresses
  bitcoinAddress: text("bitcoinAddress"),
  bitcoinCashAddress: text("bitcoinCashAddress"),
  ethereumAddress: text("ethereumAddress"),
  usdtTrc20Address: text("usdtTrc20Address"),
  bnbAddress: text("bnbAddress"),
});

// Zod schema for user validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
  is_admin: z.boolean().optional(),
  full_name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  balance: z.string().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const selectUserSchema = insertUserSchema.extend({
  id: z.number(),
  uid: z.string(),
});

// Use the Drizzle inferred type as the main User type
export type NewUser = z.infer<typeof insertUserSchema>;

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.uid), // Changed to reference users.uid (UUID)
  type: text("type").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(), // Keep both for compatibility
  updatedAt: timestamp("updated_at").defaultNow(), // Keep both for compatibility
  processedBy: integer("processed_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  // New fields for crypto deposits
  transactionHash: text("transaction_hash"),
  cryptoType: text("crypto_type"),
  walletAddress: text("wallet_address"),
  destination: text("destination"), // Add missing destination field
  planName: text("plan_name"),
  // New fields for investment plan tracking
  planDuration: text("plan_duration"),
  dailyProfit: numeric("daily_profit"),
  totalReturn: numeric("total_return"),
  expectedCompletionDate: timestamp("expected_completion_date"),
});

// System logs table
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  details: jsonb("details"),
  userId: uuid("user_id").references(() => users.uid), // Changed to UUID
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: text("ip_address"),
});

// Support messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.uid), // Changed to UUID
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("unread"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  respondedBy: integer("responded_by").references(() => users.id),
  response: text("response"),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.uid), // Changed to UUID
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  priority: text("priority").notNull().default("medium"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.uid), // Changed to UUID
  action: text("action").notNull(),
  description: text("description").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  severity: text("severity").default("low"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investments table for 24-hour profit system
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.uid), // Changed to UUID
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactions.id),
  planName: text("plan_name").notNull(),
  planDuration: text("plan_duration").notNull(),
  dailyProfit: numeric("daily_profit").notNull(),
  totalReturn: numeric("total_return").notNull(),
  principalAmount: numeric("principal_amount").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"),
  daysElapsed: integer("days_elapsed").notNull().default(0),
  totalEarned: numeric("total_earned").notNull().default("0"),
  lastReturnApplied: timestamp("last_return_applied"),
  firstProfitDate: timestamp("first_profit_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investment returns table for tracking daily profits
export const investmentReturns = pgTable("investment_returns", {
  id: serial("id").primaryKey(),
  investmentId: integer("investment_id")
    .notNull()
    .references(() => investments.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.uid), // Changed to UUID
  amount: numeric("amount").notNull(),
  returnDate: timestamp("return_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Visitor tracking table
export const visitor_tracking = pgTable("visitor_tracking", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").references(() => users.id),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
});

// System settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Additional user-related schemas for legacy code support
export const legacyUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
  full_name: z.string().optional(),
  is_admin: z.boolean().optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedBy: true,
  rejectionReason: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  respondedBy: true,
  response: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
  updatedBy: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// Investment schemas
export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentReturnSchema = createInsertSchema(
  investmentReturns
).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;

export type InvestmentReturn = typeof investmentReturns.$inferSelect;
export type InsertInvestmentReturn = z.infer<
  typeof insertInvestmentReturnSchema
>;

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "transfer"
  | "investment";
export type TransactionStatus = "pending" | "completed" | "rejected";
export type LogType = "info" | "warning" | "error" | "audit";
export type MessageStatus = "unread" | "read" | "replied";
export type Role = "user" | "admin";
export type NotificationType =
  | "transaction"
  | "account"
  | "security"
  | "marketing"
  | "system"
  | "verification";
export type NotificationPriority = "low" | "medium" | "high";

// Goal type for financial goals planning
export type Goal = {
  id: number;
  userId: number;
  name: string;
  title: string;
  description?: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "active" | "completed" | "paused" | "cancelled";
  progress: number;
  createdAt: Date;
  updatedAt: Date;
};
