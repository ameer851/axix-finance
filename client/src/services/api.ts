/**
 * API Service for Axix Finance
 * Centralizes all API calls to the backend
 */

import { Transaction, User } from "@shared/schema";
import config from "../config";

const API_BASE_URL = config.apiUrl;

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
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
};

// Financial APIs
export const financialAPI = {
  // Deposits
  getDeposits: async (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    const endpoint = `/api/deposits${params ? `?${params}` : ""}`;
    const response = await fetchWithAuth(endpoint);
    return response;
  },

  createDeposit: async (data: { amount: number; currency: string }) => {
    const response = await fetchWithAuth("/api/deposits", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },

  approveDeposit: async (depositId: string) => {
    const response = await fetchWithAuth(`/api/deposits/${depositId}/approve`, {
      method: "POST",
    });
    return response;
  },

  rejectDeposit: async (depositId: string) => {
    const response = await fetchWithAuth(`/api/deposits/${depositId}/reject`, {
      method: "POST",
    });
    return response;
  },

  deleteDeposit: async (depositId: string) => {
    const response = await fetchWithAuth(`/api/deposits/${depositId}`, {
      method: "DELETE",
    });
    return response;
  },

  // Withdrawals
  getWithdrawals: async (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    const endpoint = `/api/withdrawals${params ? `?${params}` : ""}`;
    const response = await fetchWithAuth(endpoint);
    return response;
  },

  createWithdrawal: async (data: {
    amount: number;
    currency: string;
    address: string;
  }) => {
    const response = await fetchWithAuth("/api/withdrawals", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  },

  approveWithdrawal: async (withdrawalId: string) => {
    const response = await fetchWithAuth(
      `/api/withdrawals/${withdrawalId}/approve`,
      {
        method: "POST",
      }
    );
    return response;
  },

  rejectWithdrawal: async (withdrawalId: string) => {
    const response = await fetchWithAuth(
      `/api/withdrawals/${withdrawalId}/reject`,
      {
        method: "POST",
      }
    );
    return response;
  },

  deleteWithdrawal: async (withdrawalId: string) => {
    const response = await fetchWithAuth(`/api/withdrawals/${withdrawalId}`, {
      method: "DELETE",
    });
    return response;
  },

  // Balance
  getBalance: async (userId?: string) => {
    const endpoint = userId ? `/api/users/${userId}/balance` : "/api/balance";
    const response = await fetchWithAuth(endpoint);
    return response;
  },

  // User Management
  getUsers: async () => {
    const response = await fetchWithAuth("/api/users");
    return response;
  },

  getUser: async (userId: string) => {
    const response = await fetchWithAuth(`/api/users/${userId}`);
    return response;
  },

  updateUser: async (userId: string, data: any) => {
    const response = await fetchWithAuth(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response;
  },

  deleteUser: async (userId: string) => {
    const response = await fetchWithAuth(`/api/users/${userId}`, {
      method: "DELETE",
    });
    return response;
  },
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return fetchWithAuth("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData: Partial<User>) => {
    return fetchWithAuth("/api/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    localStorage.removeItem("authToken");
    return { success: true };
  },

  forgotPassword: async (email: string) => {
    return fetchWithAuth("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    return fetchWithAuth("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  verifyEmail: async (token: string) => {
    return fetchWithAuth(`/auth/verify-email/${token}`);
  },

  getCurrentUser: async () => {
    return fetchWithAuth("/auth/me");
  },
};

// User API
export const userAPI = {
  getUser: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}`);
  },

  updateUser: async (userId: string, userData: Partial<User>) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    });
  },

  updatePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    return fetchWithAuth(`/users/${userId}/password`, {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  deleteUser: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: "DELETE",
    });
  },
};

// Transactions API
export const transactionAPI = {
  getTransactions: async (userId: string, params?: Record<string, any>) => {
    const queryParams = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return fetchWithAuth(`/users/${userId}/transactions${queryParams}`);
  },

  getTransaction: async (transactionId: string) => {
    return fetchWithAuth(`/transactions/${transactionId}`);
  },

  createTransaction: async (data: Partial<Transaction>) => {
    return fetchWithAuth("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTransaction: async (
    transactionId: string,
    data: Partial<Transaction>
  ) => {
    return fetchWithAuth(`/transactions/${transactionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteTransaction: async (transactionId: string) => {
    return fetchWithAuth(`/transactions/${transactionId}`, {
      method: "DELETE",
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

  createInvestment: async (data: Record<string, any>) => {
    return fetchWithAuth("/investments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateInvestment: async (investmentId: string, data: Record<string, any>) => {
    return fetchWithAuth(`/investments/${investmentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteInvestment: async (investmentId: string) => {
    return fetchWithAuth(`/investments/${investmentId}`, {
      method: "DELETE",
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

  getPerformance: async (userId: string, period: string = "all") => {
    return fetchWithAuth(
      `/users/${userId}/portfolio/performance?period=${period}`
    );
  },

  rebalancePortfolio: async (
    userId: string,
    allocations: Record<string, number>
  ) => {
    return fetchWithAuth(`/users/${userId}/portfolio/rebalance`, {
      method: "POST",
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

  createGoal: async (data: Record<string, any>) => {
    return fetchWithAuth("/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateGoal: async (goalId: string, data: Record<string, any>) => {
    return fetchWithAuth(`/goals/${goalId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteGoal: async (goalId: string) => {
    return fetchWithAuth(`/goals/${goalId}`, {
      method: "DELETE",
    });
  },
};

// Market Data API
export const marketAPI = {
  getMarketOverview: async () => {
    return fetchWithAuth("/market/overview");
  },

  getSecurityDetails: async (symbol: string) => {
    return fetchWithAuth(`/market/securities/${symbol}`);
  },

  getWatchlist: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/watchlist`);
  },

  addToWatchlist: async (userId: string, symbol: string) => {
    return fetchWithAuth(`/users/${userId}/watchlist`, {
      method: "POST",
      body: JSON.stringify({ symbol }),
    });
  },

  removeFromWatchlist: async (userId: string, symbol: string) => {
    return fetchWithAuth(`/users/${userId}/watchlist/${symbol}`, {
      method: "DELETE",
    });
  },

  getTopMovers: async () => {
    return fetchWithAuth("/market/top-movers");
  },

  getMarketNews: async (filter?: string) => {
    const queryParams = filter ? `?category=${filter}` : "";
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
      method: "PATCH",
    });
  },

  markAllAsRead: async (userId: string) => {
    return fetchWithAuth(`/users/${userId}/notifications/read-all`, {
      method: "PATCH",
    });
  },

  updateNotificationSettings: async (
    userId: string,
    settings: Record<string, boolean>
  ) => {
    return fetchWithAuth(`/users/${userId}/notification-settings`, {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  },

  createPriceAlert: async (
    userId: string,
    symbol: string,
    price: number,
    direction: "above" | "below"
  ) => {
    return fetchWithAuth(`/users/${userId}/price-alerts`, {
      method: "POST",
      body: JSON.stringify({ symbol, price, direction }),
    });
  },
};

// Report and Statements API
export const reportAPI = {
  getStatements: async (userId: string, period?: string) => {
    const queryParams = period ? `?period=${period}` : "";
    return fetchWithAuth(`/users/${userId}/statements${queryParams}`);
  },

  downloadStatement: async (statementId: string) => {
    return fetchWithAuth(`/statements/${statementId}/download`, {
      headers: {
        Accept: "application/pdf",
      },
    });
  },

  getTaxReports: async (userId: string, year?: number) => {
    const queryParams = year ? `?year=${year}` : "";
    return fetchWithAuth(`/users/${userId}/tax-reports${queryParams}`);
  },

  downloadTaxReport: async (reportId: string) => {
    return fetchWithAuth(`/tax-reports/${reportId}/download`, {
      headers: {
        Accept: "application/pdf",
      },
    });
  },

  getProfitLossSummary: async (userId: string, period: string = "year") => {
    return fetchWithAuth(`/users/${userId}/profit-loss?period=${period}`);
  },
};

// Support API
export const supportAPI = {
  createTicket: async (
    userId: string,
    data: { subject: string; message: string; priority: string }
  ) => {
    return fetchWithAuth(`/users/${userId}/support-tickets`, {
      method: "POST",
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
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  closeTicket: async (ticketId: string) => {
    return fetchWithAuth(`/support-tickets/${ticketId}/close`, {
      method: "PATCH",
    });
  },

  getFAQs: async () => {
    return fetchWithAuth("/support/faqs");
  },

  requestAdvisorCall: async (
    userId: string,
    data: { date: string; time: string; reason: string }
  ) => {
    return fetchWithAuth(`/users/${userId}/advisor-calls`, {
      method: "POST",
      body: JSON.stringify(data),
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
};
