import { Transaction, InsertTransaction, TransactionType, TransactionStatus } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { api } from '@/lib/api';

// Mock data for development
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    userId: 1,
    type: 'deposit',
    amount: '1000',
    status: 'completed',
    description: 'Initial deposit',
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
    processedBy: null,
    rejectionReason: null
  },
  {
    id: 2,
    userId: 1,
    type: 'withdrawal',
    amount: '500',
    status: 'completed',
    description: 'Withdrawal to bank account',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
    processedBy: null,
    rejectionReason: null
  },
  {
    id: 3,
    userId: 1,
    type: 'transfer',
    amount: '100',
    status: 'completed',
    description: 'Transfer to savings',
    createdAt: new Date(),
    updatedAt: new Date(),
    processedBy: null,
    rejectionReason: null
  },
  {
    id: 4,
    userId: 1,
    type: 'withdrawal',
    amount: '1000',
    status: 'pending',
    description: 'Withdrawal request',
    createdAt: new Date(),
    updatedAt: new Date(),
    processedBy: null,
    rejectionReason: null
  }
];

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
  order?: 'asc' | 'desc';
};

/**
 * Create a new transaction
 */
export async function createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
  try {
    const response = await apiRequest('POST', '/transactions', transactionData);
    return await response.json();
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    
    // Enhance error messages based on status codes
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid transaction data. Please check your inputs.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to perform this transaction.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to create transaction. Please try again later.');
  }
}

/**
 * Get a single transaction by ID
 */
export async function getTransaction(transactionId: number): Promise<Transaction> {
  try {
    const response = await apiRequest('GET', `/transactions/${transactionId}`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    
    if (error.status === 404) {
      throw new Error('Transaction not found. It may have been deleted or you may not have access to it.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to view this transaction.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch transaction details. Please try again later.');
  }
}

/**
 * Get all transactions with optional filtering and pagination
 */
export async function getTransactions(filters: TransactionFilters = {}): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();
    
    if (filters.userId) queryParams.append('userId', String(filters.userId));
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.minAmount) queryParams.append('minAmount', String(filters.minAmount));
    if (filters.maxAmount) queryParams.append('maxAmount', String(filters.maxAmount));
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.order) queryParams.append('order', filters.order);
    
    const url = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest('GET', url);
    
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view these transactions.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch transactions. Please try again later.');
  }
}

/**
 * Get pending transactions with optional filters
 */
export async function getPendingTransactions(filters: Omit<TransactionFilters, 'status'> = {}): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return getTransactions({ ...filters, status: 'pending' });
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: number, 
  status: TransactionStatus
): Promise<Transaction> {
  try {
    const payload: { status: TransactionStatus } = { status };
    
    const response = await apiRequest('PATCH', `/transactions/${transactionId}/status`, payload);
    const updatedTransaction = await response.json();
    
    return updatedTransaction;
  } catch (error: any) {
    console.error('Error updating transaction status:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to update this transaction.');
    } else if (error.status === 404) {
      throw new Error('Transaction not found. It may have been deleted.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid transaction status update. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || `Failed to update transaction status to ${status}. Please try again later.`);
  }
}

/**
 * Get user transactions by user ID
 */
export async function getUserTransactions(userId?: number | string): Promise<Transaction[]> {
  try {
    if (userId) {
      return await api.get(`/api/transactions/${userId}`);
    } else {
      return await api.get('/api/transactions');
    }
  } catch (error: any) {
    console.error('Error fetching user transactions:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to view these transactions.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else {
      throw new Error(error.message || 'Failed to fetch user transactions. Please try again later.');
    }
  }
}

/**
 * Get user pending transactions
 */
export async function getUserPendingTransactions(): Promise<Transaction[]> {
  try {
    return await api.get('/api/transactions/pending');
  } catch (error: any) {
    console.error('Error fetching pending transactions:', error);
    throw new Error(error.message || 'Failed to fetch pending transactions. Please try again later.');
  }
}

/**
 * Get user deposits by user ID
 */
export async function getUserDeposits(userId?: number | string): Promise<any[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    // Use the dedicated deposits endpoint
    const response = await fetch(`/api/users/${userId}/deposits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      // Handle specific HTTP errors without triggering auth logout
      if (response.status === 404) {
        return []; // Return empty array if no deposits found
      } else if (response.status === 403) {
        throw new Error('Access denied to deposits data');
      } else if (response.status >= 500) {
        throw new Error('Server error while fetching deposits');
      } else {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch deposits`);
        } catch {
          throw new Error(`HTTP ${response.status}: Failed to fetch deposits`);
        }
      }
    }

    const deposits = await response.json();
    return Array.isArray(deposits) ? deposits : [];
  } catch (error: any) {
    console.error('Error fetching user deposits:', error);
    
    // Don't re-throw network errors that might cause auth logout
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('Network error fetching deposits, returning empty array');
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
    throw new Error('User ID is required');
  }
    try {
    // Use the actual API endpoint to get real balance data
    const response = await apiRequest('GET', `/users/${userId}/balance`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching balance:', errorData);
      
      // Try to get user from localStorage as a fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userBalance = parseFloat(user.balance || '0');
        
        console.log('Using fallback balance from stored user:', userBalance);
        
        return {
          availableBalance: userBalance,
          pendingBalance: 0,
          totalBalance: userBalance,
          lastUpdated: new Date().toISOString()
        };
      }
      
      throw new Error(errorData.message || 'Failed to fetch balance data');
    }
    
    const balanceData = await response.json();
    console.log('Fetched real balance data:', balanceData);
    
    // Ensure all values are properly parsed numbers
    return {
      availableBalance: parseFloat(balanceData.availableBalance) || 0,
      pendingBalance: parseFloat(balanceData.pendingBalance) || 0,
      totalBalance: parseFloat(balanceData.totalBalance) || 
                   (parseFloat(balanceData.availableBalance) + parseFloat(balanceData.pendingBalance)) || 0,
      lastUpdated: balanceData.lastUpdated || new Date().toISOString()
    };  } catch (error: any) {
    console.error('Error fetching user balance:', error);
    
    // Try to get user from localStorage as a fallback for any error case
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userBalance = parseFloat(user.balance || '0');
        
        console.log('Using fallback balance from stored user after error:', userBalance);
        
        return {
          availableBalance: userBalance,
          pendingBalance: 0,
          totalBalance: userBalance,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (fallbackError) {
      console.error('Error using fallback balance:', fallbackError);
      // Continue to the error handling below if fallback fails
    }
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view this balance.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch user balance. Please try again later.');
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
    const response = await apiRequest('POST', `/transactions/deposit`, data);
    return await response.json();
  } catch (error: any) {
    console.error('Error depositing funds:', error);
    throw new Error(error.message || 'Failed to process deposit. Please try again later.');
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
      const response = await apiRequest('POST', `/transactions/deposit-confirmation`, data);
      const result = await response.json();
      console.log('Server response:', result);
      return result;
    } catch (error: any) {
      // Check if it's a rate limiting error (429)
      if (error.status === 429 && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptSubmission();
      }
      
      console.error('Error submitting deposit confirmation:', error);
      
      if (error.status === 429) {
        throw new Error('Server is currently busy. Please wait a moment and try again.');
      }
      
      throw new Error(error.message || 'Failed to submit deposit confirmation. Please try again later.');
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
    throw new Error('User ID is required');
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
          transactionId: Math.floor(Math.random() * 1000) + 1
        });
      }, 1000);
    });
  } catch (error: any) {
    console.error('Error withdrawing funds:', error);
    
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid withdrawal data. Please check your inputs.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to make withdrawals.');
    } else if (error.status === 409) {
      throw new Error('Insufficient funds for this withdrawal.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to process withdrawal. Please try again later.');
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
    const response = await apiRequest('GET', '/transactions/stats');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching transaction statistics:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to access transaction statistics.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch transaction statistics. Please try again later.');
  }
}

/**
 * Get transaction type label
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer: 'Transfer',
    investment: 'Investment'
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get transaction status label
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    pending: 'Pending',
    completed: 'Completed',
    rejected: 'Rejected'
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get transaction description
 */
export function getTransactionDescription(type: TransactionType): string {
  const descriptions: Record<TransactionType, string> = {
    deposit: 'Bank transfer',
    withdrawal: 'To external wallet',
    transfer: 'To savings account',
    investment: 'Stock purchase'
  };
  return descriptions[type] || `${type} transaction`;
}
