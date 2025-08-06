
import { apiRequest } from "@/lib/queryClient";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingTransactions: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  maintenanceMode: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  role?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'deposit' | 'withdrawal';
  amount: string;
  status: 'pending' | 'completed' | 'rejected';
  method?: string;
  address?: string;
  reference?: string;
  created_at: string;
  users?: User;
}

export const adminService = {
  // Get admin dashboard stats
  getStats: async (): Promise<AdminStats> => {
    try {
      const response = await apiRequest("GET", "/api/admin/stats");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      throw new Error("Failed to fetch admin statistics");
    }
  },

  // Get all users
  getUsers: async (page = 1, limit = 10): Promise<{ users: User[], total: number, totalPages: number }> => {
    try {
      const response = await apiRequest("GET", `/api/admin/users?page=${page}&limit=${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  },

  // Get deposits
  getDeposits: async (status?: string): Promise<{ transactions: Transaction[], total: number }> => {
    try {
      const url = status ? `/api/admin/transactions?type=deposit&status=${status}` : "/api/admin/transactions?type=deposit";
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching deposits:", error);
      throw new Error("Failed to fetch deposits");
    }
  },

  // Get withdrawals
  getWithdrawals: async (status?: string): Promise<{ transactions: Transaction[], total: number }> => {
    try {
      const url = status ? `/api/admin/transactions?type=withdrawal&status=${status}` : "/api/admin/transactions?type=withdrawal";
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      throw new Error("Failed to fetch withdrawals");
    }
  },

  // Approve transaction
  approveTransaction: async (id: number): Promise<void> => {
    try {
      await apiRequest("PATCH", `/api/admin/transactions/${id}/status`, { status: "completed" });
    } catch (error) {
      console.error("Error approving transaction:", error);
      throw new Error("Failed to approve transaction");
    }
  },

  // Reject transaction
  rejectTransaction: async (id: number): Promise<void> => {
    try {
      await apiRequest("PATCH", `/api/admin/transactions/${id}/status`, { status: "rejected" });
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      throw new Error("Failed to reject transaction");
    }
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    try {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  },

  // Update user password
  updateUserPassword: async (userId: number, newPassword: string): Promise<void> => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}/password`, { password: newPassword });
    } catch (error) {
      console.error("Error updating user password:", error);
      throw new Error("Failed to update user password");
    }
  },

  // Update admin password
  updateAdminPassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
    try {
      await apiRequest("POST", "/api/admin/password", { 
        currentPassword, 
        newPassword, 
        confirmPassword 
      });
    } catch (error) {
      console.error("Error updating admin password:", error);
      throw new Error("Failed to update admin password");
    }
  }
};

export default adminService;
