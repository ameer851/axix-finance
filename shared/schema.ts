import { pgTable, text, serial, integer, boolean, numeric, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["deposit", "withdrawal", "transfer", "investment"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "rejected"]);
export const logTypeEnum = pgEnum("log_type", ["info", "warning", "error", "audit"]);
export const messageStatusEnum = pgEnum("message_status", ["unread", "read", "replied"]);
export const notificationTypeEnum = pgEnum("notification_type", ["transaction", "account", "security", "marketing", "system", "verification"]);
export const notificationPriorityEnum = pgEnum("notification_priority", ["low", "medium", "high"]);

// Users table
export const users = pgTable("users", {
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
  usdtTrc20Address: text("usdt_trc20_address"),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  status: transactionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  processedBy: integer("processed_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
});

// System logs table
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  type: logTypeEnum("type").notNull(),
  message: text("message").notNull(),
  details: jsonb("details"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: text("ip_address"),
});

// Support messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").notNull().default("unread"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  respondedBy: integer("responded_by").references(() => users.id),
  response: text("response"),
});

// Notifications table
export const notifications = pgTable("notifications", {
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
  expiresAt: timestamp("expires_at"),
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

// Schemas for validation and type inference
export const insertUserSchema = createInsertSchema(users).omit({ 
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

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
  processedBy: true,
  rejectionReason: true
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  createdAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  respondedBy: true,
  response: true
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
  updatedBy: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true
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

export type TransactionType = "deposit" | "withdrawal" | "transfer" | "investment";
export type TransactionStatus = "pending" | "completed" | "rejected";
export type LogType = "info" | "warning" | "error" | "audit";
export type MessageStatus = "unread" | "read" | "replied";
export type Role = "user" | "admin";
export type NotificationType = "transaction" | "account" | "security" | "marketing" | "system" | "verification";
export type NotificationPriority = "low" | "medium" | "high";

// Goal type for financial goals planning
export type Goal = {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
};
