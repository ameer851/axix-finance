import { apiRequest } from '@/lib/queryClient';
import { safelyParseJSON } from '@/lib/apiHelpers';

// Rate limiting utility
class RateLimiter {
  private requestTimes: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const times = this.requestTimes.get(key) || [];
    
    // Remove old requests outside the window
    const validTimes = times.filter(time => now - time < this.windowMs);
    
    if (validTimes.length >= this.maxRequests) {
      return false;
    }
    
    validTimes.push(now);
    this.requestTimes.set(key, validTimes);
    return true;
  }

  getWaitTime(key: string): number {
    const times = this.requestTimes.get(key) || [];
    if (times.length === 0) return 0;
    
    const oldestTime = Math.min(...times);
    const waitTime = this.windowMs - (Date.now() - oldestTime);
    return Math.max(0, waitTime);
  }
}

const rateLimiter = new RateLimiter();

// Add a simple delay function for handling rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedData(key: string, data: any, ttl = 30000): void { // 30 seconds default TTL
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

// Clear cache function for debugging
function clearCache(): void {
  cache.clear();
  console.log('Admin service cache cleared');
}

// Export cache management functions
export { clearCache };

// Admin Dashboard Statistics
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingTransactions: number;
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

// User Management Types
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDeposit {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'completed' | 'rejected';
  transactionHash?: string;
  cryptoType?: string;
  walletAddress?: string;
  planName?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface AdminWithdrawal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  destination: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  fee: number;
  netAmount: number;
}

export interface AdminTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  method?: string;
  type?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

// Admin Dashboard Services
export const adminService = {
  // Dashboard Stats with caching (temporarily disabled rate limiting for debugging)
  getStats: async (): Promise<AdminStats> => {
    const cacheKey = 'admin-stats';
    
    // Check cache first
    const cachedStats = getCachedData(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    try {
      const response = await apiRequest('GET', '/api/admin/stats');
      const data = await safelyParseJSON(response, 'Admin stats');
      
      // Cache the result for 30 seconds
      setCachedData(cacheKey, data, 30000);
      
      return data;
    } catch (error: any) {
      console.error('Admin stats error:', error);
      if (error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment before refreshing.');
      }
      if (error.message.includes('Authentication required')) {
        throw error;
      }
      throw new Error('Failed to load admin statistics. Please check your connection and try again.');
    }
  },

  // User Management
  getUsers: async (filters: FilterOptions & PaginationOptions = {}) => {
    try {
      // Use the simplified admin users endpoint that works with Supabase
      const response = await apiRequest('GET', `/api/admin/users-simple`);
      const data = await safelyParseJSON(response, 'Admin users');
      
      // Apply filters client-side for now
      let users = data.users || [];
      
      // Apply filters if provided
      if (filters.status && filters.status !== 'all') {
        users = users.filter((user: any) => {
          if (filters.status === 'active') return user.is_active;
          if (filters.status === 'inactive') return !user.is_active;
          return true;
        });
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        users = users.filter((user: any) => 
          user.username?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination client-side
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return {
        users: users.slice(startIndex, endIndex),
        total: users.length,
        page,
        totalPages: Math.ceil(users.length / limit)
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  updateUser: async (userId: number, updates: Partial<AdminUser>) => {
    const response = await apiRequest('PUT', `/api/admin/users/${userId}`, updates);
    return await response.json();
  },

  deleteUser: async (userId: number) => {
    const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
    return await response.json();
  },

  // Bulk User Operations
  bulkUpdateUsers: async (userIds: number[], updates: Partial<AdminUser>) => {
    const response = await apiRequest('POST', '/api/admin/users/bulk-update', {
      userIds,
      updates
    });
    return await response.json();
  },

  // Deposit Management with caching (temporarily disabled rate limiting for debugging)
  getDeposits: async (filters: FilterOptions & PaginationOptions = {}) => {
    const cacheKey = `admin-deposits-${JSON.stringify(filters)}`;
    
    // Check cache first (shorter TTL for dynamic data)
    const cachedDeposits = getCachedData(cacheKey);
    if (cachedDeposits) {
      return cachedDeposits;
    }

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiRequest('GET', `/api/admin/deposits?${params}`);
      
      // Check if response is ok and has content
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check content type and length
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      if (contentLength === '0') {
        console.warn('Empty response received for deposits');
        return { deposits: [], totalPages: 0, currentPage: 1, totalDeposits: 0 };
      }
      
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Non-JSON response received:', contentType);
        console.warn('Response status:', response.status);
        console.warn('Response URL:', response.url);
        
        // If we got HTML, it's likely a redirect to login page
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Authentication required - received HTML response (likely redirected to login)');
        }
        
        return { deposits: [], totalPages: 0, currentPage: 1, totalDeposits: 0 };
      }
      
      const text = await response.text();
      if (!text.trim()) {
        console.warn('Empty response body received for deposits');
        return { deposits: [], totalPages: 0, currentPage: 1, totalDeposits: 0 };
      }
      
      try {
        const data = JSON.parse(text);
        
        // Cache for 15 seconds (shorter for transaction data)
        setCachedData(cacheKey, data, 15000);
        
        return data;
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching deposits:', error);
      if (error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment before refreshing.');
      }
      throw error;
    }
  },

  updateDeposit: async (depositId: string, updates: Partial<AdminDeposit>) => {
    const response = await apiRequest('PUT', `/api/admin/deposits/${depositId}`, updates);
    return await response.json();
  },

  deleteDeposit: async (depositId: string) => {
    const response = await apiRequest('DELETE', `/api/admin/deposits/${depositId}`);
    return await response.json();
  },

  updateWithdrawal: async (withdrawalId: string, updates: Partial<AdminWithdrawal>) => {
    const response = await apiRequest('PUT', `/api/admin/withdrawals/${withdrawalId}`, updates);
    return await response.json();
  },

  deleteWithdrawal: async (withdrawalId: string) => {
    const response = await apiRequest('DELETE', `/api/admin/withdrawals/${withdrawalId}`);
    return await response.json();
  },

  // Generic bulk actions
  bulkAction: async (type: 'deposits' | 'withdrawals' | 'users', action: string, ids: string[]) => {
    const response = await apiRequest('POST', `/api/admin/${type}/bulk-${action}`, {
      [`${type.slice(0, -1)}Ids`]: ids // Convert 'deposits' to 'depositIds', etc.
    });
    return await response.json();
  },

  // Settings shortcuts
  getSettings: async () => {
    return adminService.getSystemSettings();
  },

  updateSettings: async (settings: Record<string, any>) => {
    return adminService.updateSystemSettings(settings);
  },

  updateDepositStatus: async (depositId: string, status: string, reason?: string) => {
    const response = await apiRequest('PUT', `/api/admin/deposits/${depositId}/status`, {
      status,
      reason
    });
    return await response.json();
  },

  bulkApproveDeposits: async (depositIds: string[]) => {
    const response = await apiRequest('POST', '/api/admin/deposits/bulk-approve', {
      depositIds
    });
    return await response.json();
  },

  bulkRejectDeposits: async (depositIds: string[]) => {
    const response = await apiRequest('POST', '/api/admin/deposits/bulk-reject', {
      depositIds
    });
    return await response.json();
  },

  bulkDeleteDeposits: async (depositIds: string[]) => {
    const response = await apiRequest('DELETE', '/api/admin/deposits/bulk-delete', {
      depositIds
    });
    return await response.json();
  },

  // Withdrawal Management
  getWithdrawals: async (filters: FilterOptions & PaginationOptions = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    console.log('Fetching withdrawals with params:', Object.fromEntries(params.entries()));
    
    try {
      const response = await apiRequest('GET', `/api/admin/withdrawals?${params}`);
      const data = await response.json();
      console.log('Withdrawal API raw response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      throw error;
    }
  },

  updateWithdrawalStatus: async (withdrawalId: string, status: string, reason?: string) => {
    const response = await apiRequest('PUT', `/api/admin/withdrawals/${withdrawalId}/status`, {
      status,
      reason
    });
    return await response.json();
  },
  
  createTestWithdrawal: async () => {
    try {
      // Create a test withdrawal for demonstration purposes
      const response = await apiRequest('POST', `/api/transactions`, { 
        type: 'withdrawal',
        amount: 500, 
        method: 'Bank Transfer',
        wallet_address: null
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create test withdrawal:', error);
      throw error;
    }
  },

  bulkApproveWithdrawals: async (withdrawalIds: string[]) => {
    const response = await apiRequest('POST', '/api/admin/withdrawals/bulk-approve', {
      withdrawalIds
    });
    return await response.json();
  },

  bulkRejectWithdrawals: async (withdrawalIds: string[]) => {
    const response = await apiRequest('POST', '/api/admin/withdrawals/bulk-reject', {
      withdrawalIds
    });
    return await response.json();
  },

  // Transaction Management
  getTransactions: async (filters: FilterOptions & PaginationOptions = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await apiRequest('GET', `/api/admin/transactions?${params}`);
    return await response.json();
  },

  updateTransactionStatus: async (transactionId: string, status: string, reason?: string) => {
    const response = await apiRequest('PUT', `/api/admin/transactions/${transactionId}/status`, {
      status,
      reason
    });
    return await response.json();
  },

  bulkUpdateTransactions: async (transactionIds: string[], status: string, reason?: string) => {
    const response = await apiRequest('POST', '/api/admin/transactions/bulk-update', {
      transactionIds,
      status,
      reason
    });
    return await response.json();
  },

  // Settings Management
  getSystemSettings: async () => {
    const response = await apiRequest('GET', '/api/admin/settings');
    return await response.json();
  },

  updateSystemSettings: async (settings: Record<string, any>) => {
    const response = await apiRequest('PUT', '/api/admin/settings', settings);
    return await response.json();
  },

  // Maintenance Management
  getMaintenanceSettings: async () => {
    const response = await apiRequest('GET', '/api/admin/maintenance');
    return await response.json();
  },

  updateMaintenanceSettings: async (settings: Record<string, any>) => {
    const response = await apiRequest('PUT', '/api/admin/maintenance', settings);
    return await response.json();
  },

  toggleMaintenanceMode: async (enabled: boolean) => {
    const response = await apiRequest('PUT', '/api/admin/maintenance', { enabled });
    return await response.json();
  },

  // Audit Logs
  getAuditLogs: async (filters: FilterOptions & PaginationOptions = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await apiRequest('GET', `/api/admin/audit-logs?${params}`);
    return await response.json();
  },

  // Export Functions
  exportUsers: async (format: 'csv' | 'pdf' = 'csv') => {
    const response = await apiRequest('GET', `/api/admin/export/users?format=${format}`);
    return response; // Return response directly for download handling
  },

  exportTransactions: async (format: 'csv' | 'pdf' = 'csv', filters: FilterOptions = {}) => {
    const params = new URLSearchParams({ format });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await apiRequest('GET', `/api/admin/export/transactions?${params}`);
    return response; // Return response directly for download handling
  },

  // Admin Password Management
  updateAdminPassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const response = await apiRequest('POST', '/api/admin/update-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return await response.json();
  },

  // Individual Deposit Actions
  approveDeposit: async (id: number) => {
    const response = await apiRequest('POST', `/api/admin/deposits/${id}/approve`);
    return await response.json();
  },

  rejectDeposit: async (id: number) => {
    const response = await apiRequest('POST', `/api/admin/deposits/${id}/reject`);
    return await response.json();
  },

  // Individual Withdrawal Actions
  approveWithdrawal: async (id: number) => {
    const response = await apiRequest('POST', `/api/admin/withdrawals/${id}/approve`);
    return await response.json();
  },

  rejectWithdrawal: async (id: number) => {
    const response = await apiRequest('POST', `/api/admin/withdrawals/${id}/reject`);
    return await response.json();
  },

  // Bulk Delete Withdrawals
  bulkDeleteWithdrawals: async (ids: string[]) => {
    const response = await apiRequest('POST', '/api/admin/withdrawals/bulk-delete', { ids });
    return await response.json();
  },

  // System Health
  getSystemHealth: async () => {
    const response = await apiRequest('GET', '/health');
    return await response.json();
  },

  // Dashboard Quick Actions
  processPendingTransactions: async () => {
    const response = await apiRequest('POST', '/api/admin/process-pending');
    return await response.json();
  },

  generateReports: async (type: string, filters: Record<string, any> = {}) => {
    const response = await apiRequest('POST', '/api/admin/generate-report', {
      type,
      filters
    });
    return await response.json();
  }
};

export default adminService;
