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
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const response = await apiRequest("GET", "/api/admin/stats");
      const data = await response.json();
      return data as AdminDashboardStats;
    } catch (error) {
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
