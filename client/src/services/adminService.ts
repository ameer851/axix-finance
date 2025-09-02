import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import {
  AdminDashboardStats,
  AdminPasswordUpdate,
  AuditLog,
  PaginatedResponse,
  SystemHealth,
  SystemSettings,
  TransactionFilters,
} from "@/types/admin";
import { Transaction } from "@/types/transaction";
import { User } from "@/types/user";

// Types
interface BulkActionPayload {
  ids: string[];
  action: "approve" | "reject" | "delete";
  type: "deposits" | "withdrawals" | "transactions";
}

interface ErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Admin service implementation
export const adminService = {
  approveDeposit: async (depositId: string) => {
    return adminService.deposits.approve(depositId);
  },
  rejectDeposit: async (depositId: string) => {
    return adminService.deposits.reject(depositId);
  },
  deleteDeposit: async (depositId: string) => {
    return adminService.deposits.delete(depositId);
  },
  deposits: {
    getAll: async (
      filters?: TransactionFilters
    ): Promise<PaginatedResponse<Transaction>> => {
      // Delegate to backend admin API for consistent behavior
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", String(filters.status));
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);
      if (filters?.amountMin)
        params.set("amountMin", String(filters.amountMin));
      if (filters?.amountMax)
        params.set("amountMax", String(filters.amountMax));
      const url = `/admin/deposits${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<any>(url);
      // Normalize to PaginatedResponse shape
      const list = Array.isArray(res?.deposits)
        ? res.deposits
        : Array.isArray(res?.data)
          ? res.data
          : [];
      return {
        data: list,
        success: true,
        pagination: {
          page: 1,
          limit: list.length,
          total: res?.totalDeposits ?? list.length,
          pages: 1,
        },
      };
    },
    approve: async (depositId: string) => {
      return api.post(`/admin/deposits/${depositId}/approve`, {});
    },
    reject: async (depositId: string) => {
      return api.post(`/admin/deposits/${depositId}/reject`, {});
    },
    delete: async (depositId: string) => {
      throw new Error("Delete operation not supported");
    },
  },

  withdrawals: {
    getAll: async (
      filters?: TransactionFilters
    ): Promise<PaginatedResponse<Transaction>> => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", String(filters.status));
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);
      if (filters?.amountMin)
        params.set("amountMin", String(filters.amountMin));
      if (filters?.amountMax)
        params.set("amountMax", String(filters.amountMax));
      const url = `/admin/withdrawals${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<any>(url);
      const list = Array.isArray(res?.withdrawals)
        ? res.withdrawals
        : Array.isArray(res?.data)
          ? res.data
          : [];
      return {
        data: list,
        success: true,
        pagination: {
          page: 1,
          limit: list.length,
          total: res?.totalWithdrawals ?? list.length,
          pages: 1,
        },
      };
    },
    approve: async (withdrawalId: string) => {
      return api.post(`/admin/withdrawals/${withdrawalId}/approve`, {});
    },
    reject: async (withdrawalId: string) => {
      return api.post(`/admin/withdrawals/${withdrawalId}/reject`, {});
    },
    delete: async (withdrawalId: string) => {
      return api.delete(`/admin/withdrawals/${withdrawalId}`);
    },
  },

  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const [
        { data: users, error: usersError, count: totalUsers },
        { data: transactions, error: txError },
        { data: activeVisitors, error: visitorError },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact" }),
        supabase.from("transactions").select("*"),
        supabase
          .from("visitor_tracking")
          .select("*", { count: "exact" })
          .gte(
            "lastActivity",
            new Date(Date.now() - 15 * 60 * 1000).toISOString()
          ),
      ]);

      if (usersError) throw usersError;
      if (txError) throw txError;

      const activeUsers = users?.filter((u) => u.isActive).length || 0;
      const deposits = transactions?.filter((t) => t.type === "deposit") || [];
      const withdrawals =
        transactions?.filter((t) => t.type === "withdrawal") || [];

      const totalDeposits = deposits.reduce(
        (sum, d) => sum + parseFloat(d.amount),
        0
      );
      const totalWithdrawals = withdrawals.reduce(
        (sum, w) => sum + parseFloat(w.amount),
        0
      );

      return {
        totalUsers: totalUsers || 0,
        activeUsers,
        transactionVolume: totalDeposits,
        totalTransactions: deposits.length + withdrawals.length,
        deposits: {
          total: deposits.length,
          pending: deposits.filter((d) => d.status === "pending").length,
          approved: deposits.filter((d) => d.status === "completed").length,
          thisMonth: deposits.filter(
            (d) => new Date(d.created_at).getMonth() === new Date().getMonth()
          ).length,
        },
        withdrawals: {
          total: withdrawals.length,
          pending: withdrawals.filter((w) => w.status === "pending").length,
          approved: withdrawals.filter((w) => w.status === "completed").length,
          thisMonth: withdrawals.filter(
            (w) => new Date(w.created_at).getMonth() === new Date().getMonth()
          ).length,
        },
        totalDeposits,
        totalWithdrawals,
        pendingTransactions:
          deposits.filter((d) => d.status === "pending").length +
          withdrawals.filter((w) => w.status === "pending").length,
        conversionRate:
          Array.isArray(activeVisitors) && (activeVisitors as any).length
            ? (
                (deposits.length / (activeVisitors as any).length) *
                100
              ).toFixed(2) + "%"
            : "N/A",
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("Failed to fetch dashboard stats");
    }
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    try {
      // Check Supabase connection
      const { data, error } = await supabase
        .from("users")
        .select("count", { count: "exact", head: true });

      return {
        status: error ? "error" : "healthy",
        lastChecked: new Date().toISOString(),
      } as any; // Cast to any until interface extended
    } catch (error) {
      throw new Error("Failed to fetch system health");
    }
  },

  getSystemSettings: async (): Promise<SystemSettings> => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as SystemSettings;
    } catch (error) {
      throw new Error("Failed to fetch system settings");
    }
  },

  updateSystemSettings: async (
    settings: Partial<SystemSettings>
  ): Promise<SystemSettings> => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .upsert(settings)
        .select()
        .single();

      if (error) throw error;
      return data as SystemSettings;
    } catch (error) {
      throw new Error("Failed to update system settings");
    }
  },

  getUsers: async (
    filters?: Partial<TransactionFilters>
  ): Promise<PaginatedResponse<User>> => {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filters?.search) {
        query = query.or(
          `email.ilike.%${filters.search}%,username.ilike.%${filters.search}%`
        );
      }

      query = query.range(offset, offset + limit - 1);

      const { data: users, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error("Failed to fetch users");
    }
  },

  getAuditLogs: async (
    filters?: Partial<TransactionFilters>
  ): Promise<PaginatedResponse<AuditLog>> => {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("audit_logs")
        .select("*, users(id, username, email)", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filters?.search) {
        query = query.or(
          `description.ilike.%${filters.search}%,action.ilike.%${filters.search}%`
        );
      }

      query = query.range(offset, offset + limit - 1);

      const { data: logs, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: logs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error("Failed to fetch audit logs");
    }
  },

  updateAdminPassword: async ({
    currentPassword,
    newPassword,
  }: AdminPasswordUpdate): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error) {
      throw new Error("Failed to update admin password");
    }
  },

  bulkAction: async (payload: BulkActionPayload): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update({
          status:
            payload.action === "approve"
              ? "completed"
              : payload.action === "reject"
                ? "rejected"
                : undefined,
        })
        .in("id", payload.ids)
        .eq("type", payload.type === "deposits" ? "deposit" : "withdrawal");

      if (error) throw error;
    } catch (error) {
      throw new Error("Failed to perform bulk action");
    }
  },
} as const;

export default adminService;
