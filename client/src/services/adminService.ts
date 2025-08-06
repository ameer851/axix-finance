
import { apiRequest } from "@/lib/queryClient";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingTransactions: number;
  pendingDeposits?: number;
  pendingWithdrawals?: number;
  maintenanceMode: boolean;
  deposits?: {
    total: number;
    pending: number;
    approved: number;
    thisMonth: number;
  };
  withdrawals?: {
    total: number;
    pending: number;
    approved: number;
    thisMonth: number;
  };
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
  id: number | string;
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
      const response = await fetch("/api/admin/stats-simple", {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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
  getDeposits: async (status?: string): Promise<{ deposits: Transaction[], totalDeposits: number }> => {
    try {
      const url = status ? `/api/admin/deposits-simple?status=${status}` : "/api/admin/deposits-simple";
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching deposits:", error);
      throw new Error("Failed to fetch deposits");
    }
  },

  // Get withdrawals
  getWithdrawals: async (status?: string): Promise<{ transactions: Transaction[], total: number }> => {
    try {
      const url = status ? `/api/admin/transactions?type=withdrawal&status=${status}` : "/api/admin/transactions?type=withdrawal";
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      throw new Error("Failed to fetch withdrawals");
    }
  },

  // Get users
  getUsers: async (page = 1, limit = 10): Promise<{ users: User[], total: number, totalPages: number }> => {
    try {
      const response = await fetch(`/api/admin/users-simple?page=${page}&limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        users: data.users || [],
        total: data.users?.length || 0,
        totalPages: 1
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  },

  // Approve transaction
  approveTransaction: async (id: number | string): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/transactions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ status: "completed" })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      throw new Error("Failed to approve transaction");
    }
  },

  // Reject transaction
  rejectTransaction: async (id: number | string): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/transactions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ status: "rejected" })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      throw new Error("Failed to reject transaction");
    }
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  },

  // Update user password
  updateUserPassword: async (userId: number, newPassword: string): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ newPassword })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating user password:", error);
      throw new Error("Failed to update user password");
    }
  },

  // Update admin password
  updateAdminPassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
    try {
      const response = await fetch("/api/admin/update-password", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword, 
          confirmPassword 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating admin password:", error);
      throw error;
    }
  }
};

export default adminService;
