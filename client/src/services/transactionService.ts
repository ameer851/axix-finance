import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import {
  InsertTransaction,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@shared/schema";

export type TransactionFilters = {
  userId?: number;
  status?: TransactionStatus;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

/**
 * Create a new transaction
 */
export async function createTransaction(
  transactionData: InsertTransaction
): Promise<Transaction> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      console.error("Error creating transaction:", error);
      if (error.code === "23505") {
        throw new Error("A transaction with these details already exists.");
      } else if (error.code === "23503") {
        throw new Error(
          "Invalid reference data in transaction. Please check user ID and other references."
        );
      } else if (error.code === "42501") {
        throw new Error(
          "You do not have permission to create this transaction."
        );
      }
      throw new Error(error.message || "Failed to create transaction");
    }

    return data;
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

/**
 * Get a single transaction by ID
 */
export async function getTransaction(
  transactionId: number
): Promise<Transaction> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (error) {
      console.error("Error fetching transaction:", error);
      if (error.code === "PGRST116") {
        throw new Error("Transaction not found");
      }
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
}

/**
 * Get all transactions with optional filtering and pagination
 */
export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let query = supabase.from("transactions").select("*", { count: "exact" });

    // Apply filters
    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.startDate) query = query.gte("createdAt", filters.startDate);
    if (filters.endDate) query = query.lte("createdAt", filters.endDate);
    if (filters.minAmount) query = query.gte("amount", filters.minAmount);
    if (filters.maxAmount) query = query.lte("amount", filters.maxAmount);
    if (filters.search)
      query = query.ilike("description", `%${filters.search}%`);

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.order || "desc";
      query = query.order(filters.sortBy, { ascending: order === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error("Error fetching transactions:", error);
      throw new Error(error.message || "Failed to fetch transactions");
    }

    return {
      transactions: transactions || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    throw new Error(error.message || "Failed to fetch transactions");
  }
}

/**
 * Get pending transactions with optional filters
 */
export async function getPendingTransactions(
  filters: Omit<TransactionFilters, "status"> = {}
): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return getTransactions({ ...filters, status: "pending" });
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: number,
  status: TransactionStatus
): Promise<Transaction> {
  try {
    const payload = { status };
    return await api.patch<Transaction>(
      `/transactions/${transactionId}/status`,
      payload
    );
  } catch (error: any) {
    console.error("Error updating transaction status:", error);

    if (error.status === 403) {
      throw new Error("You do not have permission to update this transaction.");
    } else if (error.status === 404) {
      throw new Error("Transaction not found. It may have been deleted.");
    } else if (error.status === 400) {
      throw new Error(
        error.message ||
          "Invalid transaction status update. Please check your inputs."
      );
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message ||
        `Failed to update transaction status to ${status}. Please try again later.`
    );
  }
}

/**
 * Get user transactions by user ID
 */
export async function getUserTransactions(
  userId?: number | string
): Promise<Transaction[]> {
  try {
    if (userId) {
      return await api.get(`/transactions/${userId}`);
    } else {
      return await api.get("/transactions");
    }
  } catch (error: any) {
    console.error("Error fetching user transactions:", error);
    if (error.status === 403) {
      throw new Error("You do not have permission to view these transactions.");
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else {
      throw new Error(
        error.message ||
          "Failed to fetch user transactions. Please try again later."
      );
    }
  }
}

/**
 * Get user pending transactions
 */
export async function getUserPendingTransactions(): Promise<Transaction[]> {
  try {
    return await api.get("/transactions/pending");
  } catch (error: any) {
    console.error("Error fetching pending transactions:", error);
    throw new Error(
      error.message ||
        "Failed to fetch pending transactions. Please try again later."
    );
  }
}

/**
 * Get user deposits by user ID
 */
export async function getUserDeposits(
  userId?: number | string
): Promise<any[]> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    // Use transactions endpoint filtered by type=deposit
    const raw = await api.get(
      `/users/${userId}/transactions?type=deposit&limit=100`
    );
    const data =
      raw && typeof raw === "object" && "data" in raw ? (raw as any).data : raw;
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.transactions)
        ? (data as any).transactions
        : [];
    return list;
  } catch (error: any) {
    console.error("Error fetching user deposits:", error);

    // Don't re-throw network errors that might cause auth logout
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.warn("Network error fetching deposits, returning empty array");
      return [];
    }

    throw error;
  }
}

/**
 * Get user balance by user ID
 */
export async function getUserBalance(userId?: number | string): Promise<{
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  lastUpdated: string;
}> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    const balanceData = await api.get<{
      availableBalance: number;
      pendingBalance: number;
      totalBalance: number;
      lastUpdated: string;
    }>(`/users/${userId}/balance`);

    console.log("Fetched real balance data:", balanceData);

    // Ensure all values are properly parsed numbers
    return {
      availableBalance: balanceData.availableBalance || 0,
      pendingBalance: balanceData.pendingBalance || 0,
      totalBalance:
        balanceData.totalBalance ||
        (balanceData.availableBalance || 0) + (balanceData.pendingBalance || 0),
      lastUpdated: balanceData.lastUpdated || new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error fetching user balance:", error);

    // Try to get user from localStorage as a fallback for any error case
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userBalance = parseFloat(user.balance || "0");

        console.log(
          "Using fallback balance from stored user after error:",
          userBalance
        );

        return {
          availableBalance: userBalance,
          pendingBalance: 0,
          totalBalance: userBalance,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (fallbackError) {
      console.error("Error using fallback balance:", fallbackError);
      // Continue to the error handling below if fallback fails
    }

    if (error.status === 403) {
      throw new Error("You do not have permission to view this balance.");
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message || "Failed to fetch user balance. Please try again later."
    );
  }
}

/**
 * Deposit funds to user account
 */
export async function depositFunds(data: {
  amount: number;
  method: string;
  currency: string;
}): Promise<{
  success: boolean;
  amount: number;
  transactionId: number;
}> {
  try {
    return await api.post(`/transactions/deposit`, data);
  } catch (error: any) {
    console.error("Error depositing funds:", error);
    throw new Error(
      error.message || "Failed to process deposit. Please try again later."
    );
  }
}

/**
 * Submit deposit confirmation with transaction hash
 * Includes retry logic for rate limiting
 */
export async function submitDepositConfirmation(data: {
  amount: number;
  cryptoType: string;
  walletAddress: string;
  transactionHash: string;
  planName: string;
}): Promise<{
  success: boolean;
  amount: number;
  transactionId: number;
}> {
  const maxRetries = 3;
  let retryCount = 0;

  const attemptSubmission = async (): Promise<any> => {
    try {
      const result = await api.post(`/transactions/deposit-confirmation`, data);
      console.log("Server response:", result);
      return result;
    } catch (error: any) {
      // Check if it's a rate limiting error (429)
      if (error.status === 429 && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(
          `Rate limited. Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return attemptSubmission();
      }

      console.error("Error submitting deposit confirmation:", error);

      if (error.status === 429) {
        throw new Error(
          "Server is currently busy. Please wait a moment and try again."
        );
      }

      throw new Error(
        error.message ||
          "Failed to submit deposit confirmation. Please try again later."
      );
    }
  };

  return attemptSubmission();
}

/**
 * Withdraw funds from user account
 */
export async function withdrawFunds(data: {
  userId?: number | string;
  amount: number;
  method: string;
  currency: string;
  details?: any;
}): Promise<{
  success: boolean;
  amount: number;
  transactionId: number;
}> {
  if (!data.userId) {
    throw new Error("User ID is required");
  }

  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('POST', `/transactions/withdraw`, data);
    // return await response.json();

    // For development, return mock success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          amount: data.amount,
          transactionId: Math.floor(Math.random() * 1000) + 1,
        });
      }, 1000);
    });
  } catch (error: any) {
    console.error("Error withdrawing funds:", error);

    if (error.status === 400) {
      throw new Error(
        error.message || "Invalid withdrawal data. Please check your inputs."
      );
    } else if (error.status === 403) {
      throw new Error("You do not have permission to make withdrawals.");
    } else if (error.status === 409) {
      throw new Error("Insufficient funds for this withdrawal.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message || "Failed to process withdrawal. Please try again later."
    );
  }
}

export async function getTransactionStats(): Promise<{
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  totalVolume: string;
  averageTransactionAmount: string;
  transactionsByType: { type: TransactionType; count: number }[];
  transactionsByStatus: { status: TransactionStatus; count: number }[];
  transactionTrend: { date: string; count: number; volume: string }[];
}> {
  try {
    return await api.get("/transactions/stats");
  } catch (error: any) {
    console.error("Error fetching transaction statistics:", error);

    if (error.status === 403) {
      throw new Error(
        "You do not have permission to access transaction statistics."
      );
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }

    throw new Error(
      error.message ||
        "Failed to fetch transaction statistics. Please try again later."
    );
  }
}

/**
 * Get transaction type label
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    transfer: "Transfer",
    investment: "Investment",
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get transaction status label
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    pending: "Pending",
    completed: "Completed",
    rejected: "Rejected",
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get transaction description
 */
export function getTransactionDescription(type: TransactionType): string {
  const descriptions: Record<TransactionType, string> = {
    deposit: "Bank transfer",
    withdrawal: "To external wallet",
    transfer: "To savings account",
    investment: "Stock purchase",
  };
  return descriptions[type] || `${type} transaction`;
}
