import { apiRequest } from "@/lib/queryClient";
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
  deposits: {
    getAll: async (
      filters?: TransactionFilters
    ): Promise<PaginatedResponse<Transaction>> => {
      try {
        const searchParams = filters
          ? new URLSearchParams(
              Object.entries(filters).map(([key, value]) => [
                key,
                String(value),
              ])
            )
          : "";
        const url = `/api/admin/deposits${searchParams ? `?${searchParams}` : ""}`;
        const response = await apiRequest("GET", url);
        return response.json();
      } catch (error) {
        console.error("Error fetching deposits:", error);
        throw new Error("Failed to fetch deposits");
      }
    },
    approve: async (depositId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/deposits/${depositId}/approve`
      );
      return response.json();
    },
    reject: async (depositId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/deposits/${depositId}/reject`
      );
      return response.json();
    },
    delete: async (depositId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/deposits/${depositId}`
      );
      return response.json();
    },
  },

  withdrawals: {
    getAll: async (
      filters?: TransactionFilters
    ): Promise<PaginatedResponse<Transaction>> => {
      try {
        const searchParams = filters
          ? new URLSearchParams(
              Object.entries(filters).map(([key, value]) => [
                key,
                String(value),
              ])
            )
          : "";
        const url = `/api/admin/withdrawals${searchParams ? `?${searchParams}` : ""}`;
        const response = await apiRequest("GET", url);
        return response.json();
      } catch (error) {
        console.error("Error fetching withdrawals:", error);
        throw new Error("Failed to fetch withdrawals");
      }
    },
    approve: async (withdrawalId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/withdrawals/${withdrawalId}/approve`
      );
      return response.json();
    },
    reject: async (withdrawalId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/withdrawals/${withdrawalId}/reject`
      );
      return response.json();
    },
    delete: async (withdrawalId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/withdrawals/${withdrawalId}`
      );
      return response.json();
    },
  },

  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const response = await apiRequest("GET", "/api/admin/dashboard");
      const data = await response.json();
      return {
        ...data,
        transactionVolume: data.deposits.reduce(
          (sum: number, deposit: any) => sum + Number(deposit.amount),
          0
        ),
        totalUsers: data.usersCount,
        activeUsers: data.usersCount,
        totalTransactions: data.deposits.length + data.withdrawals.length,
        conversionRate:
          ((data.deposits.length / (data.visitorsCount || 1)) * 100).toFixed(
            2
          ) + "%",
      } as AdminDashboardStats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("Failed to fetch dashboard stats");
    }
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    try {
      const response = await apiRequest("GET", "/api/admin/health");
      const data = await response.json();
      return data as SystemHealth;
    } catch (error) {
      throw new Error("Failed to fetch system health");
    }
  },

  getSystemSettings: async (): Promise<SystemSettings> => {
    try {
      const response = await apiRequest("GET", "/api/admin/settings");
      const data = await response.json();
      return data as SystemSettings;
    } catch (error) {
      throw new Error("Failed to fetch system settings");
    }
  },

  updateSystemSettings: async (
    settings: Partial<SystemSettings>
  ): Promise<SystemSettings> => {
    try {
      const response = await apiRequest(
        "POST",
        "/api/admin/settings",
        settings
      );
      const data = await response.json();
      return data as SystemSettings;
    } catch (error) {
      throw new Error("Failed to update system settings");
    }
  },

  getUsers: async (
    filters?: Partial<TransactionFilters>
  ): Promise<PaginatedResponse<User>> => {
    try {
      const searchParams = filters
        ? new URLSearchParams(
            Object.entries(filters).map(([key, value]) => [key, String(value)])
          )
        : "";
      const url = `/api/admin/users${searchParams ? `?${searchParams}` : ""}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data as PaginatedResponse<User>;
    } catch (error) {
      throw new Error("Failed to fetch users");
    }
  },

  getTransactions: async (
    filters?: Partial<TransactionFilters>
  ): Promise<PaginatedResponse<Transaction>> => {
    try {
      const searchParams = filters
        ? new URLSearchParams(
            Object.entries(filters).map(([key, value]) => [key, String(value)])
          )
        : "";
      const url = `/api/admin/transactions${searchParams ? `?${searchParams}` : ""}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data as PaginatedResponse<Transaction>;
    } catch (error) {
      throw new Error("Failed to fetch transactions");
    }
  },

  getAuditLogs: async (
    filters?: Partial<TransactionFilters>
  ): Promise<PaginatedResponse<AuditLog>> => {
    try {
      const searchParams = filters
        ? new URLSearchParams(
            Object.entries(filters).map(([key, value]) => [key, String(value)])
          )
        : "";
      const url = `/api/admin/audit-logs${searchParams ? `?${searchParams}` : ""}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data as PaginatedResponse<AuditLog>;
    } catch (error) {
      throw new Error("Failed to fetch audit logs");
    }
  },

  updateAdminPassword: async (data: AdminPasswordUpdate): Promise<void> => {
    try {
      await apiRequest("POST", "/api/admin/password", data);
    } catch (error) {
      throw new Error("Failed to update admin password");
    }
  },

  bulkAction: async (payload: BulkActionPayload): Promise<void> => {
    try {
      await apiRequest("POST", "/api/admin/bulk-action", payload);
    } catch (error) {
      throw new Error("Failed to perform bulk action");
    }
  },
} as const;

export default adminService;
