export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  transactionVolume: number;
  totalTransactions: number;
  deposits: {
    total: number;
    pending: number;
    approved: number;
    thisMonth: number;
  };
  withdrawals: {
    total: number;
    pending: number;
    approved: number;
    thisMonth: number;
  };
  totalDeposits: number;
  totalWithdrawals: number;
  pendingTransactions: number;
  conversionRate: string;
}

export interface SystemHealth {
  status: "healthy" | "warning" | "error";
  components: {
    database: "up" | "down";
    redis: "up" | "down";
    email: "up" | "down";
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    requestsPerMinute: number;
  };
}

export interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message: string;
  };
  features: {
    registration: boolean;
    deposits: boolean;
    withdrawals: boolean;
    trading: boolean;
  };
  limits: {
    minDeposit: number;
    maxDeposit: number;
    minWithdrawal: number;
    maxWithdrawal: number;
  };
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  location: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
}

export interface AdminPasswordUpdate {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "pending" | "completed" | "rejected";
  type?: "deposit" | "withdrawal" | "transfer" | "investment";
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}
