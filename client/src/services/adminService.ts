import { User, Transaction } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await apiRequest('GET', '/api/users');
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch users');
  }
}

export async function getAdminDashboardStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  pendingTransactions: number;
  transactionVolume: string;
}> {
  try {
    // In a real application, this would be a dedicated API endpoint
    // For now, we'll calculate based on available data
    const users = await getAllUsers();
    const pendingTransactions = await getPendingTransactions();
    
    // Calculate transaction volume (simplified)
    const transactions = await getAllTransactions();
    const totalVolume = transactions.reduce((sum, transaction) => {
      const amount = parseFloat(transaction.amount as string);
      return sum + amount;
    }, 0);
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(user => parseFloat(user.balance as string) > 0).length,
      pendingTransactions: pendingTransactions.length,
      transactionVolume: totalVolume.toFixed(2)
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch admin dashboard statistics');
  }
}

export async function getPendingTransactions(): Promise<Transaction[]> {
  try {
    const response = await apiRequest('GET', '/api/transactions/pending');
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch pending transactions');
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const response = await apiRequest('GET', '/api/transactions');
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch all transactions');
  }
}

export async function approveTransaction(transactionId: number): Promise<Transaction> {
  try {
    const response = await apiRequest('PATCH', `/api/transactions/${transactionId}/status`, {
      status: 'completed'
    });
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to approve transaction');
  }
}

export async function rejectTransaction(transactionId: number): Promise<Transaction> {
  try {
    const response = await apiRequest('PATCH', `/api/transactions/${transactionId}/status`, {
      status: 'rejected'
    });
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reject transaction');
  }
}

export async function getUserById(userId: number): Promise<User> {
  try {
    const response = await apiRequest('GET', `/api/users/${userId}`);
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user details');
  }
}
