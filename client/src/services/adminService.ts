import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import {
  AdminDashboardStats,
  AdminPasswordUpdate,
  AuditLog,
  DailyJobHealthResponse,
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

  jobs: {
    getDailyInvestmentStatus: async () => {
      try {
        return await api.get<any>(`/admin/jobs/daily-investments/status`);
      } catch (e) {
        console.error("Failed to fetch job status", e);
        return null;
      }
    },
    getDailyInvestmentHealth:
      async (): Promise<DailyJobHealthResponse | null> => {
        try {
          return await api.get<DailyJobHealthResponse>(
            `/admin/jobs/daily-investments/health`
          );
        } catch (e) {
          console.error("Failed to fetch job health", e);
          return null;
        }
      },
    listDailyInvestmentRuns: async (page = 1, limit = 10) => {
      try {
        return await api.get<any>(
          `/admin/jobs/daily-investments/runs?page=${page}&limit=${limit}`
        );
      } catch (e) {
        console.error("Failed to fetch job runs", e);
        return null;
      }
    },
    // triggerDailyInvestment removed: daily returns now run only via automated cron worker
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
    filters?: Partial<TransactionFilters> & { action?: string }
  ): Promise<PaginatedResponse<AuditLog>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.search) params.set("search", String(filters.search));
      if ((filters as any)?.action)
        params.set("action", String((filters as any).action));

      const res = await api.get<any>(
        `/admin/audit-logs${params.toString() ? `?${params.toString()}` : ""}`
      );

      const data = Array.isArray(res?.data) ? res.data : [];
      const pagination = res?.pagination || {
        page: filters?.page || 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
      };
      return {
        success: true,
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          pages: pagination.totalPages,
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
  ledger: {
    list: async (opts?: {
      page?: number;
      limit?: number;
      userId?: number;
      entryType?: string;
      referenceTable?: string;
      referenceId?: number;
    }) => {
      const page = opts?.page || 1;
      const limit = opts?.limit || 50;
      const offset = (page - 1) * limit;
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (opts?.userId) params.set("userId", String(opts.userId));
      if (opts?.entryType) params.set("entryType", opts.entryType);
      if (opts?.referenceTable)
        params.set("referenceTable", String(opts.referenceTable));
      if (opts?.referenceId)
        params.set("referenceId", String(opts.referenceId));
      const res = await api.get<any>(`/admin/ledger?${params.toString()}`);
      const items = res?.items || [];
      const total = res?.count ?? items.length;
      return {
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      } as PaginatedResponse<any>;
    },
  },
  jobRuns: {
    list: async (opts?: {
      page?: number;
      limit?: number;
      jobName?: string;
      success?: boolean;
    }) => {
      const page = opts?.page || 1;
      const limit = opts?.limit || 50;
      const offset = (page - 1) * limit;
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (opts?.jobName) params.set("jobName", opts.jobName);
      if (typeof opts?.success === "boolean")
        params.set("success", String(opts.success));
      const res = await api.get<any>(`/admin/job-runs?${params.toString()}`);
      const items = res?.items || [];
      const total = res?.count ?? items.length;
      return {
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      } as PaginatedResponse<any>;
    },
  },
} as const;

export default adminService;
