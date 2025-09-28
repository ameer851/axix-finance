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
  // Extended UI fields (optional – align with admin SettingsPage usage)
  siteName?: string;
  supportEmail?: string;
  maxDepositAmount?: number; // legacy naming
  minDepositAmount?: number; // legacy naming
  defaultDepositFee?: number;
  defaultWithdrawalFee?: number;
  maintenanceMode?: boolean; // maps to maintenance.enabled
  registrationEnabled?: boolean; // maps to features.registration
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  twoFactorRequired?: boolean;
  sessionTimeout?: number;
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

// Daily job health / runs types (mirrors /admin/jobs/daily-investments/health response)
export interface JobRunRecord {
  id: number;
  job_name: string;
  started_at: string;
  finished_at?: string | null;
  success?: boolean | null;
  processed_count?: number | null;
  completed_count?: number | null;
  total_applied?: string | null; // numeric returned as string
  error_text?: string | null;
  source?: string | null;
  meta?: Record<string, any>;
  created_at?: string;
  run_date?: string; // generated column
}

export interface DailyJobHealthStats {
  window: number; // number of runs considered
  successes: number;
  failures: number;
  successRate: number; // 0-1 fraction
  avgProcessed: number;
  avgCompleted: number;
}

export interface DailyJobHealthResponse {
  ok: boolean;
  stale: boolean;
  lastRun: JobRunRecord | null;
  recentRuns: JobRunRecord[];
  stats: DailyJobHealthStats;
}
