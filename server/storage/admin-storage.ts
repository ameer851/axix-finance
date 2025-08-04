import { auditLogs, notifications, transactions, users } from "@shared/schema";
import { and, between, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "../db";
import { GetTransactionsOptions, GetUsersOptions } from "../interfaces/admin";

type TransactionType = "deposit" | "withdrawal" | "transfer" | "investment";
type TransactionStatus = "pending" | "completed" | "rejected";
type NotificationType =
  | "transaction"
  | "account"
  | "security"
  | "marketing"
  | "system"
  | "verification";
type NotificationPriority = "low" | "medium" | "high";
type MessageStatus = "unread" | "read" | "replied";

export class DatabaseStorage {
  // Users methods
  async searchUsers(search: string) {
    return db
      .select()
      .from(users)
      .where(
        or(
          like(users.username, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      )
      .limit(10);
  }

  async getUsers(options: GetUsersOptions) {
    const query = db
      .select()
      .from(users)
      .limit(options.limit)
      .offset(options.offset);

    if (options.search) {
      query.where(
        or(
          like(users.username, `%${options.search}%`),
          like(users.email, `%${options.search}%`),
          like(users.firstName, `%${options.search}%`),
          like(users.lastName, `%${options.search}%`)
        )
      );
    }

    return query;
  }

  async getUserCount() {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    return result[0].count;
  }

  // Stats methods
  async getPendingVerificationCount() {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isVerified, false));
    return result[0].count;
  }

  async getPendingDepositCount() {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "deposit"),
          eq(transactions.status, "pending")
        )
      );
    return result[0].count;
  }

  async getPendingWithdrawalCount() {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "withdrawal"),
          eq(transactions.status, "pending")
        )
      );
    return result[0].count;
  }

  async getTotalDepositAmount() {
    const result = await db
      .select({ total: sql<number>`sum(amount)::numeric` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "deposit"),
          eq(transactions.status, "completed")
        )
      );
    return result[0].total || 0;
  }

  async getTotalWithdrawalAmount() {
    const result = await db
      .select({ total: sql<number>`sum(amount)::numeric` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "withdrawal"),
          eq(transactions.status, "completed")
        )
      );
    return result[0].total || 0;
  }

  // Activity methods
  async getRecentTransactions(limit: number) {
    return db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getRecentLogins(limit: number) {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "login"))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getRecentRegistrations(limit: number) {
    return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
  }

  async getTransactionById(id: number) {
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return result[0];
  }

  async updateTransactionStatus(id: number, status: string) {
    const result = await db
      .update(transactions)
      .set({ status, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  async getPendingDeposits(options: { limit: number; offset: number }) {
    return db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "deposit"),
          eq(transactions.status, "pending")
        )
      )
      .limit(options.limit)
      .offset(options.offset);
  }

  async getActiveVisitors() {
    // This would need to be implemented with some kind of session tracking
    // For now returning empty array as it uses demo data
    return [];
  }

  async createNotification(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
  }) {
    try {
      const result = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
          priority: "medium",
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          createdAt: new Date(),
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error("Failed to create notification:", error);
      return undefined;
    }
  }
  async getTransactions(options: GetTransactionsOptions) {
    try {
      const conditions: any[] = [];

      if (
        options.status &&
        ["pending", "completed", "rejected"].includes(options.status)
      ) {
        conditions.push(eq(transactions.status, options.status));
      }

      if (options.type) {
        conditions.push(eq(transactions.type, options.type));
      }

      if (options.dateFrom && options.dateTo) {
        conditions.push(
          between(
            transactions.createdAt,
            new Date(options.dateFrom),
            new Date(options.dateTo)
          )
        );
      }

      if (options.search) {
        conditions.push(
          or(
            like(transactions.description, `%${options.search}%`),
            like(transactions.transactionHash, `%${options.search}%`),
            like(users.email, `%${options.search}%`),
            like(users.username, `%${options.search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const query = db
        .select({
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
          planName: transactions.planName,
          user: {
            id: users.id,
            username: users.username,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id))
        .orderBy(desc(transactions.createdAt))
        .limit(options.limit)
        .offset(options.offset);

      if (whereClause) {
        query.where(whereClause);
      }

      return await query;
    } catch (error) {
      console.error("Failed to get transactions:", error);
      return [];
    }
  }

  async getTransactionCount(
    options: {
      search?: string;
      status?: string;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    try {
      const conditions: any[] = [];

      if (options.status) {
        conditions.push(
          eq(transactions.status, options.status as TransactionStatus)
        );
      }

      if (options.type) {
        conditions.push(eq(transactions.type, options.type));
      }

      if (options.dateFrom && options.dateTo) {
        conditions.push(
          between(
            transactions.createdAt,
            new Date(options.dateFrom),
            new Date(options.dateTo)
          )
        );
      }

      if (options.search) {
        conditions.push(
          or(
            like(transactions.description, `%${options.search}%`),
            like(transactions.transactionHash, `%${options.search}%`),
            like(users.email, `%${options.search}%`),
            like(users.username, `%${options.search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const query = db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id));

      if (whereClause) {
        query.where(whereClause);
      }

      const result = await query;
      return result[0].count;
    } catch (error) {
      console.error("Failed to get transaction count:", error);
      return 0;
    }
  }

  async getAuditLogs(options: {
    limit: number;
    offset: number;
    search?: string;
    action?: string;
  }) {
    try {
      const conditions: any[] = [];

      if (options.action) {
        conditions.push(eq(auditLogs.action, options.action));
      }

      if (options.search) {
        conditions.push(
          or(
            like(auditLogs.description, `%${options.search}%`),
            like(auditLogs.details, `%${options.search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const query = db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(options.limit)
        .offset(options.offset);

      if (whereClause) {
        query.where(whereClause);
      }

      return await query;
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return [];
    }
  }

  async getAuditLogCount(options: { search?: string; action?: string } = {}) {
    try {
      const conditions: any[] = [];

      if (options.action) {
        conditions.push(eq(auditLogs.action, options.action));
      }

      if (options.search) {
        conditions.push(
          or(
            like(auditLogs.description, `%${options.search}%`),
            like(auditLogs.details, `%${options.search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const query = db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(auditLogs);

      if (whereClause) {
        query.where(whereClause);
      }

      const result = await query;
      return result[0].count;
    } catch (error) {
      console.error("Failed to get audit log count:", error);
      return 0;
    }
  }
}
