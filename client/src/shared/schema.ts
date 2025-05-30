/**
 * Shared schema types for CaraxFinance
 * This file contains TypeScript interfaces used throughout the application
 */

// User related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  balance: string;
  profileImage?: string;
  phone?: string;
  address?: Address;
  preferences?: UserPreferences;
  riskProfile?: string;
  kycStatus?: 'pending' | 'verified' | 'rejected';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketAlerts: boolean;
    transactionAlerts: boolean;
    newsAlerts: boolean;
  };
  dashboardLayout?: string;
}

// Transaction related types
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'transfer' | 'fee' | 'dividend';
  status: 'pending' | 'completed' | 'failed' | 'canceled';
  amount: string;
  currency: string;
  description?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
  relatedInvestmentId?: string;
  metadata?: Record<string, any>;
}

// Investment related types
export interface Investment {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'bond' | 'mutual_fund' | 'crypto';
  quantity: number;
  purchasePrice: string;
  currentPrice: string;
  purchaseDate: string;
  currency: string;
  status: 'active' | 'sold' | 'pending';
  profit: string;
  profitPercentage: string;
  dividends?: string;
  metadata?: Record<string, any>;
}

// Portfolio related types
export interface Portfolio {
  id: string;
  userId: string;
  totalValue: string;
  cashBalance: string;
  investedAmount: string;
  totalProfit: string;
  totalProfitPercentage: string;
  dailyChange: string;
  dailyChangePercentage: string;
  lastUpdated: string;
  isBalanced: boolean;
  targetAllocation?: Record<string, number>;
  currentAllocation?: Record<string, number>;
  performance?: PortfolioPerformance;
  assets: Investment[];
}

export interface PortfolioPerformance {
  timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  data: {
    date: string;
    value: string;
  }[];
}

// Goals related types
export interface Goal {
  id: string;
  userId: string;
  name: string;
  type: 'retirement' | 'education' | 'house' | 'vacation' | 'other';
  targetAmount: string;
  currentAmount: string;
  startDate: string;
  targetDate: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  contributions?: GoalContribution[];
  strategy?: GoalStrategy;
  notes?: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: string;
  date: string;
  recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface GoalStrategy {
  riskLevel: 'low' | 'medium' | 'high';
  assetAllocation: Record<string, number>;
  recommendedInvestments: string[];
}

// Market data related types
export interface MarketData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercentage: string;
  high: string;
  low: string;
  open: string;
  previousClose: string;
  volume: string;
  marketCap?: string;
  pe?: string;
  lastUpdated: string;
}

export interface MarketOverview {
  mainIndices: MarketData[];
  topGainers: MarketData[];
  topLosers: MarketData[];
  mostActive: MarketData[];
  marketHours: {
    isOpen: boolean;
    nextOpenTime?: string;
    nextCloseTime?: string;
  };
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  category: string;
  relatedSymbols?: string[];
}

// Notification related types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'transaction' | 'price_alert' | 'news' | 'goal';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  priority: 'low' | 'medium' | 'high';
  action?: {
    type: string;
    route?: string;
    metadata?: Record<string, any>;
  };
}

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: string;
  direction: 'above' | 'below';
  status: 'active' | 'triggered' | 'deleted';
  createdAt: string;
  triggeredAt?: string;
}

// Statement and report related types
export interface Statement {
  id: string;
  userId: string;
  type: 'monthly' | 'quarterly' | 'annual';
  period: string;
  generatedAt: string;
  downloadUrl: string;
  size: string;
}

export interface TaxReport {
  id: string;
  userId: string;
  year: number;
  status: 'pending' | 'ready' | 'error';
  generatedAt?: string;
  downloadUrl?: string;
  size?: string;
}

export interface ProfitLossSummary {
  period: 'week' | 'month' | 'quarter' | 'year' | 'all';
  startDate: string;
  endDate: string;
  totalProfit: string;
  totalProfitPercentage: string;
  breakdown: {
    investments: {
      profit: string;
      profitPercentage: string;
    };
    dividends: {
      amount: string;
      percentage: string;
    };
    fees: {
      amount: string;
      percentage: string;
    };
  };
  byAssetType: Record<string, {
    profit: string;
    profitPercentage: string;
  }>;
}

// Support related types
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'closed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  assignedTo?: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'user' | 'support' | 'system';
  senderId: string;
  message: string;
  createdAt: string;
  attachments?: {
    name: string;
    url: string;
    size: string;
  }[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPopular: boolean;
  order: number;
}

export interface AdvisorMeeting {
  id: string;
  userId: string;
  advisorId?: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'missed';
  reason: string;
  notes?: string;
  meetingUrl?: string;
}

export interface SystemSettings {
  maintenance: {
    enabled: boolean;
    message: string;
    scheduledEnd?: string;
  };
  registration: {
    enabled: boolean;
    requireEmailVerification: boolean;
    allowedDomains: string[];
  };
  login: {
    maxAttempts: number;
    lockoutDuration: number;
    requireCaptcha: boolean;
  };
  features: Record<string, boolean>;
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
    expiryDays: number;
    preventReuseCount: number;
  };
  twoFactorAuth: {
    enabled: boolean;
    enforced: boolean;
    methods: ('app' | 'sms' | 'email')[];
  };
  session: {
    lifetime: number;
    idleTimeout: number;
    maxConcurrent: number;
  };
  ipRestrictions: {
    enabled: boolean;
    allowedIps: string[];
    blockedIps: string[];
  };
}

export interface Backup {
  id: string;
  name: string;
  date: string;
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
  createdBy: string;
  downloadUrl?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms';
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
  ip?: string;
}

export interface AnalyticsMetric {
  name: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  data: {
    date: string;
    value: number;
  }[];
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalInvestments: string;
  dailyTransactions: number;
  newUsersToday: number;
  pendingSupport: number;
  systemHealth: 'good' | 'warning' | 'critical';
  userGrowth: {
    period: 'week' | 'month';
    percentage: number;
  };
}

export interface Integration {
  id: string;
  name: string;
  provider: string;
  type: 'payment' | 'analytics' | 'communication' | 'security' | 'other';
  status: 'active' | 'inactive' | 'error';
  lastSynced?: string;
  enabled: boolean;
  settings: Record<string, any>;
  features: string[];
}
