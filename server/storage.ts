import { supabase } from "./supabase";

// Local type definitions
type Transaction = {
  id: number;
  userId: number;
  type: string;
  amount: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  processedBy?: number;
  rejectionReason?: string;
  cryptoType?: string;
  walletAddress?: string;
  transactionHash?: string;
  planName?: string;
  planDuration?: string;
  dailyProfit?: number;
  totalReturn?: number;
  expectedCompletionDate?: string;
};

type TransactionStatus = "pending" | "completed" | "rejected";

type User = {
  id: number;
  uid: string;
  email: string;
  full_name?: string;
  role: string;
  is_admin: boolean;
  passwordResetTokenExpiry?: string;
};

type Notification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  priority?: string;
  expiresAt?: string;
};

type AuditLog = {
  id: number;
  userId?: number;
  action: string;
  description: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
};

type VisitorTracking = {
  id: number;
  ipAddress: string;
  userAgent: string;
  page: string;
  referrer?: string;
  sessionId: string;
  userId?: number;
  createdAt: string;
  lastActivity: string;
};

// Define types for method options
interface GetUsersOptions {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
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

// Single clean DatabaseStorage class using Supabase
export class DatabaseStorage {
  /**
   * Adjust a user's available balance by a delta amount (can be negative).
   * Returns the updated user or undefined on failure.
   */
  async adjustUserBalance(
    userId: number,
    delta: number | string
  ): Promise<User | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;
      const current = Number((user as any).balance || 0);
      const change = Number(delta);
      if (!Number.isFinite(change)) {
        console.error("adjustUserBalance: invalid delta", delta);
        return undefined;
      }
      const next = current + change;
      const nextStr = next.toString();
      const updated = await this.updateUser(userId, { balance: nextStr });
      return updated;
    } catch (error) {
      console.error("Failed to adjust user balance:", error);
      return undefined;
    }
  }

  /**
   * Adjust a user's activeDeposits (principal locked in active investments).
   * Optionally move funds from/to available balance when locking/unlocking.
   */
  async adjustUserActiveDeposits(
    userId: number,
    delta: number | string,
    options?: { allowNegative?: boolean; moveWithBalance?: boolean }
  ): Promise<User | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;
      const change = Number(delta);
      if (!Number.isFinite(change)) return undefined;
      const currentLocked = Number((user as any).activeDeposits || 0);
      let nextLocked = currentLocked + change;
      if (nextLocked < 0 && !options?.allowNegative) return undefined;
      let balance = Number((user as any).balance || 0);
      if (options?.moveWithBalance) {
        if (change > 0) {
          // moving funds from balance into locked
          balance -= change;
          if (balance < 0 && !options.allowNegative) return undefined;
        } else if (change < 0) {
          // releasing funds back to balance
          balance += -change;
        }
      }
      const updated = await this.updateUser(userId, {
        activeDeposits: String(nextLocked),
        ...(options?.moveWithBalance ? { balance: String(balance) } : {}),
      });
      return updated || undefined;
    } catch (e) {
      console.error("Failed to adjust user activeDeposits:", e);
      return undefined;
    }
  }
  async cleanupDeletedUsers(): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> {
    try {
      // Get all deactivated users
      const { data: deletedUsers, error } = await supabase
        .from("users")
        .select("*")
        .eq("isActive", false)
        .like("email", "%@deleted.local");

      if (error) {
        console.error("Failed to get deleted users:", error);
        return {
          success: false,
          message: "Failed to get deleted users",
          deletedCount: 0,
        };
      }

      let deletedCount = 0;
      const errors: string[] = [];

      // Try to delete each user if they have no associated records
      for (const user of deletedUsers || []) {
        const { canDelete, associatedRecords } = await this.canUserBeDeleted(
          user.id
        );

        if (canDelete) {
          try {
            const { error: deleteError } = await supabase
              .from("users")
              .delete()
              .eq("id", user.id);

            if (!deleteError) {
              deletedCount++;
            } else {
              errors.push(`User ${user.id}: Deletion failed`);
            }
          } catch (deleteError) {
            console.error(`Failed to delete user ${user.id}:`, deleteError);
            errors.push(`User ${user.id}: Deletion failed`);
          }
        } else {
          const counts = [
            `${associatedRecords.transactions} transactions`,
            `${associatedRecords.auditLogs} audit logs`,
            `${associatedRecords.logs} logs`,
          ]
            .filter((c) => !c.startsWith("0"))
            .join(", ");
          errors.push(`User ${user.id}: Has associated records (${counts})`);
        }
      }

      const message =
        errors.length > 0
          ? `Deleted ${deletedCount} users. Some users could not be deleted:\n${errors.join("\n")}`
          : `Successfully deleted ${deletedCount} users`;

      return {
        success: true,
        message,
        deletedCount,
      };
    } catch (error) {
      console.error("Failed to cleanup deleted users:", error);
      return {
        success: false,
        message:
          "Failed to cleanup deleted users: " +
          (error instanceof Error ? error.message : "Unknown error"),
        deletedCount: 0,
      };
    }
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return undefined;
      }
      return data as Transaction;
    } catch (error) {
      console.error("Failed to get transaction:", error);
      return undefined;
    }
  }

  async updateTransactionStatus(
    id: number,
    status: TransactionStatus,
    reason?: string
  ): Promise<Transaction | undefined> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Add rejection reason if status is rejected and reason is provided
      if (status === "rejected" && reason) {
        updateData.rejectionReason = reason;
      }

      const { data, error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        return undefined;
      }
      return data as Transaction;
    } catch (error) {
      console.error("Failed to update transaction status:", error);
      return undefined;
    }
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.getTransaction(id);
  }

  async getTransactions(
    options: GetTransactionsOptions
  ): Promise<Transaction[]> {
    try {
      let query = supabase.from("transactions").select(`
          *,
          users (
            id,
            username,
            email
          )
        `);

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.type) {
        query = query.eq("type", options.type);
      }

      if (options.dateFrom && options.dateTo) {
        query = query
          .gte("created_at", options.dateFrom)
          .lte("created_at", options.dateTo);
      }

      if (options.search) {
        query = query.or(
          `description.ilike.%${options.search}%,transactionHash.ilike.%${options.search}%`
        );
      }

      const { data, error } = await query
        .range(options.offset, options.offset + options.limit - 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to get transactions:", error);
        return [];
      }

      return data as Transaction[];
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
  ): Promise<number> {
    try {
      let query = supabase
        .from("transactions")
        .select("*", { count: "exact", head: true });

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.type) {
        query = query.eq("type", options.type);
      }

      if (options.dateFrom && options.dateTo) {
        query = query
          .gte("created_at", options.dateFrom)
          .lte("created_at", options.dateTo);
      }

      if (options.search) {
        query = query.or(
          `description.ilike.%${options.search}%,transactionHash.ilike.%${options.search}%`
        );
      }

      const { count, error } = await query;

      if (error) {
        console.error("Failed to get transaction count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get transaction count:", error);
      return 0;
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to get recent transactions:", error);
        return [];
      }

      return data as Transaction[];
    } catch (error) {
      console.error("Failed to get recent transactions:", error);
      return [];
    }
  }

  async getPendingDeposits(options: {
    limit: number;
    offset: number;
  }): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "deposit")
        .eq("status", "pending")
        .range(options.offset, options.offset + options.limit - 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to get pending deposits:", error);
        return [];
      }

      return data as Transaction[];
    } catch (error) {
      console.error("Failed to get pending deposits:", error);
      return [];
    }
  }

  async getPendingDepositCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "deposit")
        .eq("status", "pending");

      if (error) {
        console.error("Failed to get pending deposit count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get pending deposit count:", error);
      return 0;
    }
  }

  async getPendingWithdrawalCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "withdrawal")
        .eq("status", "pending");

      if (error) {
        console.error("Failed to get pending withdrawal count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get pending withdrawal count:", error);
      return 0;
    }
  }

  async getTotalDepositAmount(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "deposit")
        .eq("status", "completed");

      if (error) {
        console.error("Failed to get total deposit amount:", error);
        return 0;
      }

      return data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    } catch (error) {
      console.error("Failed to get total deposit amount:", error);
      return 0;
    }
  }

  async getTotalWithdrawalAmount(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "withdrawal")
        .eq("status", "completed");

      if (error) {
        console.error("Failed to get total withdrawal amount:", error);
        return 0;
      }

      return data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    } catch (error) {
      console.error("Failed to get total withdrawal amount:", error);
      return 0;
    }
  }

  /**
   * Get time-series totals for transactions by type and interval.
   * Groups completed transactions into daily/weekly/monthly buckets for the last N days.
   */
  async getTimeSeriesSums(options: {
    type: "deposit" | "withdrawal";
    days?: number;
    interval?: "daily" | "weekly" | "monthly";
  }): Promise<Array<{ date: string; label: string; total: number }>> {
    const days = options.days ?? 14;
    const interval = options.interval ?? "daily";
    try {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - days + 1);
      // Fetch minimal fields and aggregate client-side for simplicity/portability
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, created_at, type, status")
        .eq("status", "completed")
        .eq("type", options.type)
        .gte("created_at", start.toISOString())
        .lte("created_at", now.toISOString());

      if (error) {
        console.error("getTimeSeriesSums fetch failed:", error);
        return [];
      }

      // Helper to format bucket label/date key
      const toBucket = (d: Date): { key: string; label: string } => {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        if (interval === "monthly") {
          return { key: `${yyyy}-${mm}`, label: `${yyyy}-${mm}` };
        }
        if (interval === "weekly") {
          // ISO week number
          const tmp = new Date(
            Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
          );
          // Thursday in current week decides the year.
          tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
          const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil(
            ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
          );
          return {
            key: `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`,
            label: `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`,
          };
        }
        // daily
        return { key: `${yyyy}-${mm}-${dd}`, label: `${yyyy}-${mm}-${dd}` };
      };

      // Initialize all buckets in range with zeroes
      const buckets = new Map<
        string,
        { date: string; label: string; total: number }
      >();
      const cursor = new Date(start);
      while (cursor <= now) {
        const { key, label } = toBucket(cursor);
        if (!buckets.has(key)) {
          // For monthly/weekly, the date field will be the first day of that bucket for ordering
          let dateStr = label;
          if (interval === "daily")
            dateStr = `${cursor.toISOString().slice(0, 10)}`;
          buckets.set(key, { date: dateStr, label, total: 0 });
        }
        // advance
        if (interval === "monthly") {
          cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
        } else if (interval === "weekly") {
          cursor.setUTCDate(cursor.getUTCDate() + 7);
        } else {
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
      }

      for (const row of data || []) {
        const createdAt = new Date((row as any).created_at);
        const { key } = toBucket(createdAt);
        const amt = Number((row as any).amount || 0);
        if (!Number.isFinite(amt)) continue;
        const b = buckets.get(key);
        if (b) b.total += amt;
      }

      return Array.from(buckets.values()).sort((a, b) =>
        a.label < b.label ? -1 : 1
      );
    } catch (err) {
      console.error("getTimeSeriesSums failed:", err);
      return [];
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .or(
          `username.ilike.%${query}%,email.ilike.%${query}%,firstName.ilike.%${query}%,lastName.ilike.%${query}%`
        );

      if (error) {
        console.error("Failed to search users:", error);
        return [];
      }

      return data as User[];
    } catch (error) {
      console.error("Failed to search users:", error);
      return [];
    }
  }

  async getUsers(options: GetUsersOptions): Promise<User[]> {
    try {
      let query = supabase.from("users").select("*");

      if (options.search) {
        query = query.or(
          `username.ilike.%${options.search}%,email.ilike.%${options.search}%,firstName.ilike.%${options.search}%,lastName.ilike.%${options.search}%`
        );
      }

      if (options.status) {
        if (options.status === "active") {
          query = query.eq("isActive", true);
        } else if (options.status === "inactive") {
          query = query.eq("isActive", false);
        } else if (options.status === "verified") {
          query = query.eq("isVerified", true);
        } else if (options.status === "unverified") {
          query = query.eq("isVerified", false);
        }
      }

      const { data, error } = await query
        .range(options.offset, options.offset + options.limit - 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to get users:", error);
        return [];
      }

      return data as User[];
    } catch (error) {
      console.error("Failed to get users:", error);
      return [];
    }
  }

  async getUserCount(
    options: { search?: string; status?: string } = {}
  ): Promise<number> {
    try {
      let query = supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (options.search) {
        query = query.or(
          `username.ilike.%${options.search}%,email.ilike.%${options.search}%,firstName.ilike.%${options.search}%,lastName.ilike.%${options.search}%`
        );
      }

      if (options.status) {
        if (options.status === "active") {
          query = query.eq("isActive", true);
        } else if (options.status === "inactive") {
          query = query.eq("isActive", false);
        } else if (options.status === "verified") {
          query = query.eq("isVerified", true);
        } else if (options.status === "unverified") {
          query = query.eq("isVerified", false);
        }
      }

      const { count, error } = await query;

      if (error) {
        console.error("Failed to get user count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get user count:", error);
      return 0;
    }
  }

  async getPendingVerificationCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("isVerified", false);

      if (error) {
        console.error("Failed to get pending verification count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get pending verification count:", error);
      return 0;
    }
  }

  async getRecentRegistrations(limit: number = 10): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to get recent registrations:", error);
        return [];
      }

      return data as User[];
    } catch (error) {
      console.error("Failed to get recent registrations:", error);
      return [];
    }
  }

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
      const { data: result, error } = await supabase
        .from("notifications")
        .insert({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          priority: data.priority || "medium",
          expiresAt: data.expiresAt?.toISOString(),
          isRead: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to create notification:", error);
        throw error;
      }

      return result as Notification;
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  async getAuditLogs(options: GetAuditLogsOptions): Promise<AuditLog[]> {
    try {
      let query = supabase.from("audit_logs").select("*");

      if (options.action && options.search) {
        query = query
          .eq("action", options.action)
          .ilike("details", `%${options.search}%`);
      } else if (options.action) {
        query = query.eq("action", options.action);
      } else if (options.search) {
        query = query.ilike("details", `%${options.search}%`);
      }

      const { data, error } = await query
        .range(options.offset, options.offset + options.limit - 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to get audit logs:", error);
        return [];
      }

      return data as AuditLog[];
    } catch (error) {
      console.error("Failed to get audit logs:", error);
      return [];
    }
  }

  async getAuditLogCount(
    options: { search?: string; action?: string } = {}
  ): Promise<number> {
    try {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true });

      if (options.action && options.search) {
        query = query
          .eq("action", options.action)
          .ilike("details", `%${options.search}%`);
      } else if (options.action) {
        query = query.eq("action", options.action);
      } else if (options.search) {
        query = query.ilike("details", `%${options.search}%`);
      }

      const { count, error } = await query;

      if (error) {
        console.error("Failed to get audit log count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get audit log count:", error);
      return 0;
    }
  }

  async getRecentLogins(limit: number = 10): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "login")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to get recent logins:", error);
        return [];
      }

      return data as AuditLog[];
    } catch (error) {
      console.error("Failed to get recent logins:", error);
      return [];
    }
  }

  async getActiveVisitors(): Promise<VisitorTracking[]> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("visitor_tracking")
        .select("*")
        .gt("last_activity", fiveMinutesAgo)
        .order("last_activity", { ascending: false });

      if (error) {
        console.error("Failed to get active visitors:", error);
        return [];
      }

      return data as VisitorTracking[];
    } catch (error) {
      console.error("Failed to get active visitors:", error);
      return [];
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return undefined;
      }

      return data as User;
    } catch (error) {
      console.error("Failed to get user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // First attempt exact match (fast)
      let { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();
      if (!data || error) {
        // Fallback: case-insensitive exact match (ilike) if initial attempt fails
        const lowered = username.toLowerCase();
        const { data: ciData } = await supabase
          .from("users")
          .select("*")
          .ilike("username", lowered);
        if (Array.isArray(ciData) && ciData.length === 1) {
          data = ciData[0];
        } else if (Array.isArray(ciData) && ciData.length > 1) {
          // If multiple case-insensitive matches (rare), choose exact lower-case or first
          const exactLower = ciData.find(
            (u: any) => (u.username || "").toLowerCase() === lowered
          );
          data = exactLower || ciData[0];
        }
      }
      if (!data) return undefined;
      return data as User;
    } catch (error) {
      console.error("Failed to get user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
      if (error || !data) {
        return undefined;
      }

      return data as User;
    } catch (error) {
      console.error("Failed to get user by email:", error);
      return undefined;
    }
  }

  // Lookup by Supabase auth UID (uuid string) for bearer token mapping
  async getUserByUid(uid: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("uid", uid)
        .single();

      if (error || !data) {
        return undefined;
      }
      return data as User;
    } catch (error) {
      console.error("Failed to get user by uid:", error);
      return undefined;
    }
  }

  async createUser(userData: {
    uid?: string;
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
      // Attempt 1: snake_case minimal payload compatible with canonical Supabase schema
      // Avoid columns that may not exist (like password, camelCase names)
      let attempt = 1;
      let insertResp = await supabase
        .from("users")
        .insert({
          uid: userData.uid || null,
          username: userData.username,
          email: userData.email,
          first_name: userData.firstName || null,
          last_name: userData.lastName || null,
          role: userData.role || "user",
          balance: userData.balance || "0",
          is_active: userData.isActive !== false,
          is_verified: userData.isVerified || false,
          // Keep optional snake_case fields minimal to reduce schema mismatch risk
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      let data = (insertResp as any).data as any;
      let error = (insertResp as any).error as any;

      // On column errors or undefined column (42703), fall back to camelCase payload
      if (error) {
        const msg = String(error?.message || "");
        if (
          error?.code === "42703" ||
          msg.includes("column") ||
          msg.includes("does not exist")
        ) {
          attempt = 2;
          const retry = await supabase
            .from("users")
            .insert({
              uid: userData.uid,
              username: userData.username,
              password: userData.password, // legacy schemas only
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role || "user",
              balance: userData.balance || "0",
              isActive: userData.isActive !== false,
              isVerified: userData.isVerified || false,
              twoFactorEnabled: userData.twoFactorEnabled || false,
              referredBy: userData.referredBy,
              bitcoinAddress: userData.bitcoinAddress,
              bitcoinCashAddress: userData.bitcoinCashAddress,
              ethereumAddress: userData.ethereumAddress,
              bnbAddress: userData.bnbAddress,
              usdtTrc20Address: userData.usdtTrc20Address,
              verificationToken: userData.verificationToken,
              verificationTokenExpiry:
                userData.verificationTokenExpiry?.toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any)
            .select()
            .single();
          data = (retry as any).data as any;
          error = (retry as any).error as any;
        }
      }

      if (error || !data) {
        const errObj: any = error || {};
        console.error(
          "Failed to create user (attempt=" +
            attempt +
            ") code=" +
            (errObj.code || "?") +
            " message=",
          errObj.message || errObj.error || errObj
        );
        if (errObj.details) console.error(" details:", errObj.details);
        if (errObj.hint) console.error(" hint:", errObj.hint);
        return undefined;
      }

      return data as User;
    } catch (error) {
      console.error("Failed to create user:", error);
      return undefined;
    }
  }

  async updateUser(
    id: number,
    updates: Partial<{
      username: string;
      password: string;
      email: string;
      firstName: string;
      lastName: string;
      role: "user" | "admin";
      balance: string;
      activeDeposits: string;
      isActive: boolean;
      isVerified: boolean;
      twoFactorEnabled: boolean;
      verificationToken: string | null;
      verificationTokenExpiry: Date | null;
      pendingEmail: string | null;
    }>
  ): Promise<User | undefined> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        return undefined;
      }

      return data as User;
    } catch (error) {
      console.error("Failed to update user:", error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        console.error("Failed to get all users:", error);
        return [];
      }

      return data as User[];
    } catch (error) {
      console.error("Failed to get all users:", error);
      return [];
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Check if user has associated records that would prevent deletion
      const { canDelete } = await this.canUserBeDeleted(id);

      if (canDelete) {
        const { error } = await supabase.from("users").delete().eq("id", id);

        return !error;
      } else {
        // If user has associated records, deactivate instead of deleting
        const deactivated = await this.updateUser(id, {
          isActive: false,
          username: `deleted_user_${id}_${Date.now()}`,
          email: `deleted_${id}_${Date.now()}@deleted.local`,
        });

        return deactivated !== undefined;
      }
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      return false;
    }
  }

  async canUserBeDeleted(id: number): Promise<{
    canDelete: boolean;
    reason?: string;
    associatedRecords: {
      transactions: number;
      auditLogs: number;
      logs: number;
    };
  }> {
    try {
      // Check transactions
      const { count: transactionCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("userId", id);

      // Check audit_logs
      let auditLogCount = 0;
      try {
        const { count } = await supabase
          .from("audit_logs")
          .select("*", { count: "exact", head: true })
          .eq("userId", id);
        auditLogCount = count || 0;
      } catch (auditError: any) {
        console.log(
          "Audit logs table does not exist, proceeding without audit log check"
        );
        auditLogCount = 0;
      }

      // Check for other log tables
      let logsCount = 0;
      try {
        const { count } = await supabase
          .from("logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", id);
        logsCount = count || 0;
      } catch (logsError: any) {
        console.log("Logs table does not exist, proceeding without logs check");
        logsCount = 0;
      }

      const associatedRecords = {
        transactions: transactionCount || 0,
        auditLogs: auditLogCount,
        logs: logsCount,
      };

      const totalAssociatedRecords =
        (transactionCount || 0) + auditLogCount + logsCount;

      if (totalAssociatedRecords > 0) {
        return {
          canDelete: false,
          reason: `User has ${transactionCount} transactions, ${auditLogCount} audit log entries, and ${logsCount} log entries`,
          associatedRecords,
        };
      }

      return {
        canDelete: true,
        associatedRecords,
      };
    } catch (error) {
      console.error(`Failed to check if user ${id} can be deleted:`, error);
      return {
        canDelete: false,
        reason: "Error checking user deletion eligibility",
        associatedRecords: { transactions: 0, auditLogs: 0, logs: 0 },
      };
    }
  }

  async createLog(logData: {
    type: string;
    userId?: number;
    message: string;
    details?: any;
  }): Promise<AuditLog | undefined> {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .insert({
          userId: logData.userId || null,
          action: logData.type,
          description: logData.message,
          details:
            typeof logData.details === "object"
              ? JSON.stringify(logData.details)
              : logData.details || null,
          ipAddress: null,
          userAgent: null,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.log(
          "Audit logs table does not exist, logging to console instead:",
          logData
        );
        return undefined;
      }

      return data as AuditLog;
    } catch (error: any) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        console.log(
          "Audit logs table does not exist, logging to console instead:",
          logData
        );
        return undefined;
      }
      console.error("Failed to create log:", error);
      return undefined;
    }
  }

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Simple query to test connection
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Database connection check failed:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Database connection check failed:", error);
      return false;
    }
  }

  async getUserTransactions(
    userIdOrUid: number | string
  ): Promise<Transaction[]> {
    try {
      // New canonical schema: transactions.user_id stores auth uid (uuid)
      const isUid = typeof userIdOrUid === "string" && userIdOrUid.length > 20;
      let uid: string | undefined;
      if (isUid) {
        uid = userIdOrUid as string;
      } else {
        // Need to map numeric internal id -> uid
        const user = await this.getUser(userIdOrUid as number);
        uid = user?.uid;
      }
      if (!uid) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to get user transactions (uid schema):", error);
        return [];
      }
      return (data || []) as Transaction[];
    } catch (error) {
      console.error("Failed to get user transactions:", error);
      return [];
    }
  }

  async createTransaction(transactionData: {
    userId: number; // legacy internal numeric id
    userUid?: string; // auth uid (preferred)
    type: "deposit" | "withdrawal" | "investment";
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
      const dbType =
        transactionData.type === "investment"
          ? "deposit"
          : transactionData.type;
      let attempt = 1;
      // Try snake_case first (likely actual schema)
      // Prefer uid for canonical user linkage in transactions.user_id (uuid column)
      const userIdForInsert =
        transactionData.userUid ||
        (await this.getUser(transactionData.userId))?.uid;
      let { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userIdForInsert,
          type: dbType,
          amount: transactionData.amount,
          status: transactionData.status || "pending",
          description: transactionData.description || "",
          plan_name: transactionData.planName || null,
          crypto_type: transactionData.cryptoType || null,
          wallet_address: transactionData.walletAddress || null,
          transaction_hash: transactionData.transactionHash || null,
          plan_duration: transactionData.planDuration || null,
          daily_profit: transactionData.dailyProfit || null,
          total_return: transactionData.totalReturn || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        const msg = (error as any)?.message || "";
        if (
          msg.includes("column") ||
          msg.includes("user_id") ||
          (error as any)?.code === "42703"
        ) {
          console.warn(
            "Retrying transaction insert using camelCase columns (attempt 2)"
          );
          attempt = 2;
          const retry = await supabase
            .from("transactions")
            .insert({
              userId: transactionData.userId, // legacy fallback path
              type: dbType,
              amount: transactionData.amount,
              status: transactionData.status || "pending",
              description: transactionData.description || "",
              planName: transactionData.planName || null,
              cryptoType: transactionData.cryptoType || null,
              walletAddress: transactionData.walletAddress || null,
              transactionHash: transactionData.transactionHash || null,
              planDuration: transactionData.planDuration || null,
              dailyProfit: transactionData.dailyProfit || null,
              totalReturn: transactionData.totalReturn || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .select()
            .single();
          data = retry.data as any;
          error = retry.error as any;
        }
      }

      if (error || !data) {
        const errObj: any = error || {};
        (this as any).lastTransactionError = errObj;
        console.error(
          "Failed to create transaction (attempt=" +
            attempt +
            ") code=" +
            (errObj.code || "?") +
            " message=",
          errObj.message || errObj.error || errObj
        );
        if (errObj.details) console.error(" details:", errObj.details);
        if (errObj.hint) console.error(" hint:", errObj.hint);
        if (process.env.NODE_ENV !== "production") {
          console.error("Transaction debug payload:", {
            attempt,
            input: transactionData,
            mappedType: dbType,
            supabaseCode: errObj.code,
            supabaseDetails: errObj.details,
            supabaseHint: errObj.hint,
          });
        }
        return undefined;
      }

      return data as Transaction;
    } catch (error) {
      console.error("Failed to create transaction:", error);
      return undefined;
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("isActive", true);

      if (error) {
        console.error("Failed to get active user count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get active user count:", error);
      return 0;
    }
  }

  async getVisitorsActivity(): Promise<VisitorTracking[]> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("visitor_tracking")
        .select("*")
        .gt("last_activity", fiveMinutesAgo)
        .order("last_activity", { ascending: false });

      if (error) {
        console.error("Failed to get active visitors:", error);
        return [];
      }

      return data as VisitorTracking[];
    } catch (error) {
      console.error("Failed to get active visitors:", error);
      return [];
    }
  }

  async getPendingTransactionCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) {
        console.error("Failed to get pending transaction count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get pending transaction count:", error);
      return 0;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Failed to get all transactions:", error);
        return [];
      }

      return data as Transaction[];
    } catch (error) {
      console.error("Failed to get all transactions:", error);
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
      let query = supabase
        .from("transactions")
        .select(
          `
          *,
          users (
            id,
            username,
            email
          )
        `
        )
        .eq("type", "deposit");

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.search) {
        query = query.or(
          `description.ilike.%${options.search}%,transactionHash.ilike.%${options.search}%`
        );
      }

      if (options.dateFrom) {
        query = query.gte("createdAt", options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte("createdAt", options.dateTo);
      }

      if (options.amountMin) {
        query = query.gte("amount", options.amountMin.toString());
      }

      if (options.amountMax) {
        query = query.lte("amount", options.amountMax.toString());
      }

      const { data, error } = await query
        .range(options.offset, options.offset + options.limit - 1)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Failed to get deposits:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to get deposits:", error);
      return [];
    }
  }

  async getDepositCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "deposit");

      if (error) {
        console.error("Failed to get deposit count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get deposit count:", error);
      return 0;
    }
  }

  async getWithdrawals(options: {
    limit: number;
    offset: number;
    status?: string;
    search?: string;
  }): Promise<Transaction[]> {
    try {
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("type", "withdrawal");

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.search) {
        query = query.or(
          `description.ilike.%${options.search}%,transactionHash.ilike.%${options.search}%`
        );
      }

      const { data, error } = await query
        .range(options.offset, options.offset + options.limit - 1)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Failed to get withdrawals:", error);
        return [];
      }

      return data as Transaction[];
    } catch (error) {
      console.error("Failed to get withdrawals:", error);
      return [];
    }
  }

  async getWithdrawalCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "withdrawal");

      if (error) {
        console.error("Failed to get withdrawal count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Failed to get withdrawal count:", error);
      return 0;
    }
  }

  async updateWithdrawalStatus(
    id: number,
    status: TransactionStatus
  ): Promise<Transaction | undefined> {
    return this.updateTransactionStatus(id, status);
  }

  async updateDepositStatus(
    id: number,
    status: TransactionStatus
  ): Promise<Transaction | undefined> {
    return this.updateTransactionStatus(id, status);
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      return !error;
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      return false;
    }
  }

  async getAllUsersForExport(): Promise<User[]> {
    return this.getAllUsers();
  }

  async getAllTransactionsForExport(): Promise<Transaction[]> {
    return this.getAllTransactions();
  }

  async getMaintenanceSettings(): Promise<any> {
    try {
      // For now, return default maintenance settings
      return {
        enabled: false,
        message:
          "The system is temporarily under maintenance. Please try again later.",
        startTime: null,
        endTime: null,
      };
    } catch (error) {
      console.error("Failed to get maintenance settings:", error);
      return { enabled: false, message: "Maintenance mode disabled" };
    }
  }

  async updateMaintenanceSettings(settings: any): Promise<any> {
    try {
      // For now, just log the settings update
      console.log("Maintenance settings would be updated:", settings);
      return settings;
    } catch (error) {
      console.error("Failed to update maintenance settings:", error);
      return null;
    }
  }

  async getSystemSettings(): Promise<any> {
    try {
      // For now, return default system settings
      return {
        supportEmail: "support@axixfinance.com",
        maintenanceMode: false,
        registrationEnabled: true,
      };
    } catch (error) {
      console.error("Failed to get system settings:", error);
      return {};
    }
  }

  async updateSystemSettings(settings: any): Promise<any> {
    try {
      // For now, just log the settings update
      console.log("System settings would be updated:", settings);
      return settings;
    } catch (error) {
      console.error("Failed to update system settings:", error);
      return null;
    }
  }

  async getAllSettings(): Promise<any[]> {
    try {
      // For now, return default settings
      return [
        { name: "supportEmail", value: "support@axixfinance.com" },
        { name: "maintenanceMode", value: "false" },
        { name: "registrationEnabled", value: "true" },
      ];
    } catch (error) {
      console.error("Failed to get all settings:", error);
      return [];
    }
  }

  async getSetting(name: string): Promise<any> {
    try {
      const allSettings = await this.getAllSettings();
      return allSettings.find((setting) => setting.name === name);
    } catch (error) {
      console.error(`Failed to get setting ${name}:`, error);
      return null;
    }
  }

  async createOrUpdateSetting(
    name: string,
    value: string,
    description?: string
  ): Promise<void> {
    try {
      // For now, just log that the setting would be created/updated
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `Setting '${name}' would be set to '${value}'${description ? ` (${description})` : ""}`
        );
      }
    } catch (error) {
      console.error("Failed to create or update setting:", error);
    }
  }

  async initializeDatabase(): Promise<void> {
    try {
      console.log("🔄 Initializing database with Supabase...");

      // Initialize required settings
      const requiredSettings = [
        {
          name: "minimumWithdrawal",
          value: "50",
          description: "Minimum withdrawal amount in USD",
        },
        {
          name: "withdrawalFee",
          value: "5",
          description: "Withdrawal fee percentage",
        },
        {
          name: "referralBonus",
          value: "10",
          description: "Referral bonus percentage",
        },
        {
          name: "maintenanceMode",
          value: "false",
          description: "System maintenance mode",
        },
        {
          name: "contactEmail",
          value: process.env.CONTACT_EMAIL || "support@axixfinance.com",
          description: "Support contact email",
        },
      ];

      for (const setting of requiredSettings) {
        const existingSetting = await this.getSetting(setting.name);
        if (!existingSetting) {
          await this.createOrUpdateSetting(
            setting.name,
            setting.value,
            setting.description
          );
          if (process.env.NODE_ENV !== "production")
            console.log(`Setting '${setting.name}' initialized`);
        }
      }

      if (process.env.NODE_ENV !== "production")
        console.log("Database initialization completed successfully");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }
}
