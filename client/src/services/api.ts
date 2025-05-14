/**
 * API Service for CaraxFinance
 * Centralizes all API calls to the backend
 */

import { User, Transaction, Investment, Goal, Portfolio, Notification, MarketData } from '@shared/schema';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.caraxfinance.com' 
  : 'http://localhost:5000';

// Helper function to handle fetch responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  
  return await response.text();
};

// Generic fetch function with authorization
const fetchWithAuth = async (
  endpoint: string, 
  options: RequestInit = {}
) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  return handleResponse(response);
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  register: async (userData: Partial<User>) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  logout: async () => {
    localStorage.removeItem('authToken');
    return { success: true };
  },
  
  forgotPassword: async (email: string) => {
    return fetchWithAuth('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  resetPassword: async (token: string, password: string) => {
    return fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
  
  verifyEmail: async (token: string) => {
    return fetchWithAuth(`/auth/verify-email/${token}`);
  },
  
  getCurrentUser: async () => {
    return fetchWithAuth('/auth/me');
  },
};

// User API
export const userAPI = {
  getUser: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}`);
  },
  
  updateUser: async (userId: string, userData: Partial<User>) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },
  
  updatePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    return fetchWithAuth(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  
  deleteUser: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Transactions API
export const transactionAPI = {
  getTransactions: async (userId: string, params?: Record<string, any>) => {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchWithAuth(`/users/${userId}/transactions${queryParams}`);
  },
  
  getTransaction: async (transactionId: string) => {
    return fetchWithAuth(`/transactions/${transactionId}`);
  },
  
  createTransaction: async (data: Partial<Transaction>) => {
    return fetchWithAuth('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  updateTransaction: async (transactionId: string, data: Partial<Transaction>) => {
    return fetchWithAuth(`/transactions/${transactionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  deleteTransaction: async (transactionId: string) => {
    return fetchWithAuth(`/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  },
};

// Investment API
export const investmentAPI = {
  getInvestments: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/investments`);
  },
  
  getInvestment: async (investmentId: string) => {
    return fetchWithAuth(`/investments/${investmentId}`);
  },
  
  createInvestment: async (data: Partial<Investment>) => {
    return fetchWithAuth('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  updateInvestment: async (investmentId: string, data: Partial<Investment>) => {
    return fetchWithAuth(`/investments/${investmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  deleteInvestment: async (investmentId: string) => {
    return fetchWithAuth(`/investments/${investmentId}`, {
      method: 'DELETE',
    });
  },
};

// Portfolio API
export const portfolioAPI = {
  getPortfolio: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/portfolio`);
  },
  
  getAssetAllocation: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/portfolio/allocation`);
  },
  
  getPerformance: async (userId: string, period: string = 'all') => {
    return fetchWithAuth(`/users/${userId}/portfolio/performance?period=${period}`);
  },
  
  rebalancePortfolio: async (userId: string, allocations: Record<string, number>) => {
    return fetchWithAuth(`/users/${userId}/portfolio/rebalance`, {
      method: 'POST',
      body: JSON.stringify({ allocations }),
    });
  },
};

// Goals API
export const goalAPI = {
  getGoals: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/goals`);
  },
  
  getGoal: async (goalId: string) => {
    return fetchWithAuth(`/goals/${goalId}`);
  },
  
  createGoal: async (data: Partial<Goal>) => {
    return fetchWithAuth('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  updateGoal: async (goalId: string, data: Partial<Goal>) => {
    return fetchWithAuth(`/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  deleteGoal: async (goalId: string) => {
    return fetchWithAuth(`/goals/${goalId}`, {
      method: 'DELETE',
    });
  },
};

// Market Data API
export const marketAPI = {
  getMarketOverview: async () => {
    return fetchWithAuth('/market/overview');
  },
  
  getSecurityDetails: async (symbol: string) => {
    return fetchWithAuth(`/market/securities/${symbol}`);
  },
  
  getWatchlist: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/watchlist`);
  },
  
  addToWatchlist: async (userId: string, symbol: string) => {
    return fetchWithAuth(`/users/${userId}/watchlist`, {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  },
  
  removeFromWatchlist: async (userId: string, symbol: string) => {
    return fetchWithAuth(`/users/${userId}/watchlist/${symbol}`, {
      method: 'DELETE',
    });
  },
  
  getTopMovers: async () => {
    return fetchWithAuth('/market/top-movers');
  },
  
  getMarketNews: async (filter?: string) => {
    const queryParams = filter ? `?category=${filter}` : '';
    return fetchWithAuth(`/market/news${queryParams}`);
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/notifications`);
  },
  
  getNotification: async (notificationId: string) => {
    return fetchWithAuth(`/notifications/${notificationId}`);
  },
  
  markAsRead: async (notificationId: string) => {
    return fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },
  
  markAllAsRead: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/notifications/read-all`, {
      method: 'PATCH',
    });
  },
  
  updateNotificationSettings: async (userId: string, settings: Record<string, boolean>) => {
    return fetchWithAuth(`/users/${userId}/notification-settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
  
  createPriceAlert: async (userId: string, symbol: string, price: number, direction: 'above' | 'below') => {
    return fetchWithAuth(`/users/${userId}/price-alerts`, {
      method: 'POST',
      body: JSON.stringify({ symbol, price, direction }),
    });
  },
};

// Report and Statements API
export const reportAPI = {
  getStatements: async (userId: string, period?: string) => {
    const queryParams = period ? `?period=${period}` : '';
    return fetchWithAuth(`/users/${userId}/statements${queryParams}`);
  },
  
  downloadStatement: async (statementId: string) => {
    return fetchWithAuth(`/statements/${statementId}/download`, {
      headers: {
        Accept: 'application/pdf',
      },
    });
  },
  
  getTaxReports: async (userId: string, year?: number) => {
    const queryParams = year ? `?year=${year}` : '';
    return fetchWithAuth(`/users/${userId}/tax-reports${queryParams}`);
  },
  
  downloadTaxReport: async (reportId: string) => {
    return fetchWithAuth(`/tax-reports/${reportId}/download`, {
      headers: {
        Accept: 'application/pdf',
      },
    });
  },
  
  getProfitLossSummary: async (userId: string, period: string = 'year') => {
    return fetchWithAuth(`/users/${userId}/profit-loss?period=${period}`);
  },
};

// Support API
export const supportAPI = {
  createTicket: async (userId: string, data: { subject: string, message: string, priority: string }) => {
    return fetchWithAuth(`/users/${userId}/support-tickets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getTickets: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/support-tickets`);
  },
  
  getTicket: async (ticketId: string) => {
    return fetchWithAuth(`/support-tickets/${ticketId}`);
  },
  
  replyToTicket: async (ticketId: string, message: string) => {
    return fetchWithAuth(`/support-tickets/${ticketId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  
  closeTicket: async (ticketId: string) => {
    return fetchWithAuth(`/support-tickets/${ticketId}/close`, {
      method: 'PATCH',
    });
  },
  
  getFAQs: async () => {
    return fetchWithAuth('/support/faqs');
  },
  
  requestAdvisorCall: async (userId: string, data: { date: string, time: string, reason: string }) => {
    return fetchWithAuth(`/users/${userId}/advisor-calls`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Admin API for admin dashboard
export const adminAPI = {
  // User management
  getAllUsers: async (params?: Record<string, any>) => {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchWithAuth(`/admin/users${queryParams}`);
  },
  
  updateUserStatus: async (userId: string, status: string) => {
    return fetchWithAuth(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  
  // Roles management
  getRoles: async () => {
    return fetchWithAuth('/admin/roles');
  },
  
  getRole: async (roleId: string) => {
    return fetchWithAuth(`/admin/roles/${roleId}`);
  },
  
  createRole: async (data: { name: string, description: string, permissions: string[] }) => {
    return fetchWithAuth('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  updateRole: async (roleId: string, data: { name?: string, description?: string, permissions?: string[] }) => {
    return fetchWithAuth(`/admin/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  deleteRole: async (roleId: string) => {
    return fetchWithAuth(`/admin/roles/${roleId}`, {
      method: 'DELETE',
    });
  },
  
  // System configuration
  getSystemSettings: async () => {
    return fetchWithAuth('/admin/settings');
  },
  
  updateSystemSettings: async (settings: Record<string, any>) => {
    return fetchWithAuth('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
  
  // Data management
  createBackup: async () => {
    return fetchWithAuth('/admin/backups', {
      method: 'POST',
    });
  },
  
  getBackups: async () => {
    return fetchWithAuth('/admin/backups');
  },
  
  restoreBackup: async (backupId: string) => {
    return fetchWithAuth(`/admin/backups/${backupId}/restore`, {
      method: 'POST',
    });
  },
  
  exportData: async (options: Record<string, any>) => {
    return fetchWithAuth('/admin/export', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },
  
  // Cache management
  clearCache: async (cacheType?: string) => {
    const queryParams = cacheType ? `?type=${cacheType}` : '';
    return fetchWithAuth(`/admin/cache${queryParams}`, {
      method: 'DELETE',
    });
  },
  
  // Security settings
  getSecuritySettings: async () => {
    return fetchWithAuth('/admin/security');
  },
  
  updateSecuritySettings: async (settings: Record<string, any>) => {
    return fetchWithAuth('/admin/security', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
  
  // Notifications
  sendBroadcastNotification: async (data: { title: string, message: string, recipients: string[] }) => {
    return fetchWithAuth('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getNotificationTemplates: async () => {
    return fetchWithAuth('/admin/notification-templates');
  },
  
  createNotificationTemplate: async (data: { name: string, subject: string, content: string }) => {
    return fetchWithAuth('/admin/notification-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  updateNotificationTemplate: async (templateId: string, data: { name?: string, subject?: string, content?: string }) => {
    return fetchWithAuth(`/admin/notification-templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  deleteNotificationTemplate: async (templateId: string) => {
    return fetchWithAuth(`/admin/notification-templates/${templateId}`, {
      method: 'DELETE',
    });
  },
  
  // Logs
  getSystemLogs: async (params?: Record<string, any>) => {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchWithAuth(`/admin/logs${queryParams}`);
  },
  
  // Analytics
  getAnalytics: async (metric: string, period: string = 'month') => {
    return fetchWithAuth(`/admin/analytics/${metric}?period=${period}`);
  },
  
  getDashboardStats: async () => {
    return fetchWithAuth('/admin/dashboard-stats');
  },
  
  // Integrations
  getIntegrations: async () => {
    return fetchWithAuth('/admin/integrations');
  },
  
  toggleIntegration: async (integrationId: string, enabled: boolean) => {
    return fetchWithAuth(`/admin/integrations/${integrationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  },
  
  updateIntegrationSettings: async (integrationId: string, settings: Record<string, any>) => {
    return fetchWithAuth(`/admin/integrations/${integrationId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
};

// Export all APIs
export default {
  auth: authAPI,
  user: userAPI,
  transaction: transactionAPI,
  investment: investmentAPI,
  portfolio: portfolioAPI,
  goal: goalAPI,
  market: marketAPI,
  notification: notificationAPI,
  report: reportAPI,
  support: supportAPI,
  admin: adminAPI,
};
