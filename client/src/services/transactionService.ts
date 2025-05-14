import { Transaction } from '@shared/schema';

// Define missing types
type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'transfer' | 'fee' | 'dividend';
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'canceled' | 'rejected';

// Define InsertTransaction type
type InsertTransaction = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};
import { apiRequest } from '@/lib/queryClient';
import { triggerTransactionNotification } from '@/lib/notificationTriggers';

// Mock data for development
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    userId: '1',
    type: 'deposit',
    amount: '1000',
    status: 'completed',
    currency: 'USD',
    description: 'Initial deposit',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '2',
    userId: '1',
    type: 'withdrawal',
    amount: '500',
    status: 'completed',
    currency: 'USD',
    description: 'Withdrawal to bank account',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    userId: '1',
    type: 'transfer',
    amount: '100',
    status: 'completed',
    currency: 'USD',
    description: 'Transfer to savings',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  },
  {
    id: '4',
    userId: '1',
    type: 'withdrawal',
    amount: '1000',
    status: 'pending',
    currency: 'USD',
    description: 'Withdrawal request',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const MOCK_DEPOSITS = [
  {
    id: '1',
    userId: '1',
    amount: '1000',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    method: 'bank',
    description: 'Bank transfer deposit'
  },
  {
    id: '3',
    userId: '1',
    amount: '250',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    method: 'investment',
    description: 'Investment in AAPL'
  },
  {
    id: '5',
    userId: '1',
    amount: '500',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    method: 'crypto',
    description: 'Bitcoin deposit'
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
    const response = await apiRequest('POST', '/api/transactions', transactionData);
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
    const response = await apiRequest('GET', `/api/transactions/${transactionId}`);
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
    
    const url = `/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
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
  status: TransactionStatus,
  adminNote?: string
): Promise<Transaction> {
  try {
    const payload: { status: TransactionStatus; adminNote?: string } = { status };
    if (adminNote) {
      payload.adminNote = adminNote;
    }
    
    const response = await apiRequest('PATCH', `/api/transactions/${transactionId}/status`, payload);
    const updatedTransaction = await response.json();
    
    // Trigger notification for transaction status update
    // Convert status to the expected type if needed
    const notificationStatus = status === 'failed' || status === 'canceled' ? 'rejected' : status;
    
    triggerTransactionNotification(
      updatedTransaction.userId,
      transactionId,
      notificationStatus as 'pending' | 'completed' | 'rejected',
      updatedTransaction.amount,
      updatedTransaction.type
    );
    
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
 * Update transaction details (admin only)
 */
export async function updateTransaction(
  transactionId: number,
  updateData: Partial<Transaction>
): Promise<Transaction> {
  try {
    const response = await apiRequest('PATCH', `/api/transactions/${transactionId}`, updateData);
    return await response.json();
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to update this transaction.');
    } else if (error.status === 404) {
      throw new Error('Transaction not found. It may have been deleted.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid transaction data. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to update transaction. Please try again later.');
  }
}

/**
 * Delete a transaction (admin only)
 */
export async function deleteTransaction(transactionId: number): Promise<boolean> {
  try {
    const response = await apiRequest('DELETE', `/api/transactions/${transactionId}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to delete this transaction.');
    } else if (error.status === 404) {
      throw new Error('Transaction not found. It may have been already deleted.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to delete transaction. Please try again later.');
  }
}

/**
 * Get transaction statistics
 */
/**
 * Get user transactions by user ID
 */
export async function getUserTransactions(userId?: number | string): Promise<Transaction[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/transactions/${userId}`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_TRANSACTIONS);
      }, 500);
    });
  } catch (error: any) {
    console.error('Error fetching user transactions:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view these transactions.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch user transactions. Please try again later.');
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
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/deposits/${userId}`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_DEPOSITS);
      }, 500);
    });
  } catch (error: any) {
    console.error('Error fetching user deposits:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view these deposits.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch user deposits. Please try again later.');
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
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/balance/${userId}`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          availableBalance: 12000,
          pendingBalance: 1000,
          totalBalance: 13000,
          lastUpdated: new Date().toISOString()
        });
      }, 300);
    });
  } catch (error: any) {
    console.error('Error fetching user balance:', error);
    
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
  userId?: number | string;
  amount: number;
  method: string;
  currency: string;
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
    // const response = await apiRequest('POST', `/api/transactions/deposit`, data);
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
    console.error('Error depositing funds:', error);
    
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid deposit data. Please check your inputs.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to make deposits.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to process deposit. Please try again later.');
  }
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
    // const response = await apiRequest('POST', `/api/transactions/withdraw`, data);
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
    const response = await apiRequest('GET', '/api/transactions/stats');
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
 * Approve multiple transactions at once (admin only)
 */
export async function bulkApproveTransactions(transactionIds: number[]): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  message: string;
}> {
  try {
    const response = await apiRequest('POST', '/api/transactions/bulk-approve', { transactionIds });
    return await response.json();
  } catch (error: any) {
    console.error('Error bulk approving transactions:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to approve these transactions.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid transaction IDs. Please check your selection.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to approve transactions. Please try again later.');
  }
}

/**
 * Reject multiple transactions at once (admin only)
 */
export async function bulkRejectTransactions(
  transactionIds: number[],
  reason: string
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  message: string;
}> {
  try {
    const response = await apiRequest('POST', '/api/transactions/bulk-reject', { 
      transactionIds,
      reason 
    });
    return await response.json();
  } catch (error: any) {
    console.error('Error bulk rejecting transactions:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to reject these transactions.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid transaction IDs or missing reason. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to reject transactions. Please try again later.');
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
    investment: 'Investment',
    fee: 'Fee',
    dividend: 'Dividend'
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
    rejected: 'Rejected',
    failed: 'Failed',
    canceled: 'Canceled'
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
    investment: 'Stock purchase',
    fee: 'Service fee',
    dividend: 'Dividend payment'
  };
  return descriptions[type] || `${type} transaction`;
}
