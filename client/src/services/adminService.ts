import { User, Transaction, Message, Setting, Log } from '@shared/schema';
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
    // Fetch admin dashboard stats from API
    const response = await apiRequest('GET', '/api/admin/stats');
    return await response.json();
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

export async function rejectTransaction(
  params: { transactionId: number, rejectionReason?: string }
): Promise<Transaction> {
  try {
    const { transactionId, rejectionReason } = params;
    const response = await apiRequest('PATCH', `/api/transactions/${transactionId}/status`, {
      status: 'rejected',
      rejectionReason: rejectionReason || 'Transaction rejected by admin'
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

export async function searchUsers(query: string): Promise<User[]> {
  try {
    const response = await apiRequest('GET', `/api/search/users?query=${encodeURIComponent(query)}`);
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to search users');
  }
}

export async function updateUserVerification(userId: number, isVerified: boolean): Promise<User> {
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/verify`, {
      isVerified
    });
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user verification status');
  }
}

export async function updateUserActiveStatus(userId: number, isActive: boolean): Promise<User> {
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/status`, {
      isActive
    });
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user active status');
  }
}

export async function exportUsers(): Promise<void> {
  try {
    window.open('/api/users/export', '_blank');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export users');
  }
}

export async function exportLogs(): Promise<void> {
  try {
    window.open('/api/logs/export', '_blank');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export logs');
  }
}

// Analytics endpoints
export async function getAnalyticsData(): Promise<any[]> {
  try {
    const response = await apiRequest('GET', '/api/admin/analytics');
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch analytics data');
  }
}

// Settings endpoints
export async function getAllSettings(): Promise<Setting[]> {
  try {
    const response = await apiRequest('GET', '/api/settings');
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch settings');
  }
}

export async function updateSetting(name: string, value: string, description?: string): Promise<Setting> {
  try {
    const response = await apiRequest('PUT', `/api/settings/${name}`, {
      name,
      value,
      description
    });
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update setting');
  }
}

// Logs endpoints
export async function getLogs(params?: {
  type?: string;
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<Log[]> {
  try {
    let url = '/api/logs';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append('type', params.type);
      if (params.query) queryParams.append('query', params.query);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    
    const response = await apiRequest('GET', url);
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch logs');
  }
}

// Messages endpoints
export async function getAllMessages(): Promise<Message[]> {
  try {
    const response = await apiRequest('GET', '/api/messages');
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch messages');
  }
}

export async function getUnreadMessagesCount(): Promise<number> {
  try {
    const response = await apiRequest('GET', '/api/messages/unread');
    const data = await response.json();
    return data.count || 0;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch unread message count');
  }
}

export async function respondToMessage(messageId: number, response: string): Promise<Message> {
  try {
    const apiResponse = await apiRequest('POST', `/api/messages/${messageId}/respond`, {
      response
    });
    return await apiResponse.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to respond to message');
  }
}
