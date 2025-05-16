/**
 * Admin Panel Type Definitions
 * Contains all types used throughout the admin panel
 */

import { User, Transaction } from '@shared/schema';

/**
 * Admin user roles
 */
export enum AdminRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * System settings interface
 */
export interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  withdrawalsEnabled: boolean;
  depositsEnabled: boolean;
  lastUpdated: string;
  updatedBy: string;
}

/**
 * Admin log entry
 */
export interface AdminLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

/**
 * User filter options
 */
export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  balanceRange?: [number, number] | null;
  sortBy?: 'name' | 'email' | 'created' | 'balance';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Transaction filter options
 */
export interface TransactionFilters {
  search?: string;
  type?: string;
  status?: string;
  dateRange?: [Date, Date] | null;
  amountRange?: [number, number] | null;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Admin dashboard stats
 */
export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingTransactions: number;
  depositsPending: number;
  withdrawalsPending: number;
  transactionVolume: string;
  newUsersToday: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    message?: string;
  };
}

/**
 * User detail with balance information
 */
export interface UserWithBalance extends Omit<User, 'balance'> {
  // Override the string balance with a detailed balance object
  balance: {
    available: number;
    pending: number;
    total: number;
  };
  // Additional transaction summary data
  transactions: {
    total: number;
    deposits: number;
    withdrawals: number;
  };
  lastLoginAt?: string;
  isOnline?: boolean;
}

/**
 * Response for bulk actions
 */
export interface BulkActionResponse {
  success: boolean;
  processed: number;
  failed: number;
  message: string;
  failedIds?: string[];
}

/**
 * Audit log filter options
 */
export interface AuditLogFilters {
  adminId?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}
