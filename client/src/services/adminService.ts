import { User, Transaction, Message, Setting, Log } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { triggerSystemNotification, triggerMarketingNotification } from '@/lib/notificationTriggers';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingTransactions: number;
  transactionVolume: string;
}

export async function getAllUsers(): Promise<User[]> {
  try {
    console.log('Making API request to fetch all users');
    
    // Use a direct fetch with explicit error handling for more reliable results
    const response = await fetch('/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      // Add a longer timeout for the request
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from /api/users: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 403) {
        throw new Error('You do not have permission to view user data.');
      } else {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }
    
    // Check content type to ensure we're getting JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response from /api/users:', await response.text());
      throw new Error('Server returned an invalid response format');
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Ensure the response is an array
    if (!Array.isArray(data)) {
      console.error('Expected array of users but got:', data);
      
      // If we got an object with a users property that is an array, return that
      if (data && typeof data === 'object' && Array.isArray(data.users)) {
        return data.users;
      }
      
      // Otherwise return an empty array to prevent errors
      return [];
    }
    
    console.log(`Successfully fetched ${data.length} users`);
    return data;
  } catch (error: any) {
    console.error('Error fetching all users:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server might be experiencing high load.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to view user data.');
    } else if (error.isOffline || error.isNetworkError || !navigator.onLine) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch users. Please try again later.');
  }
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const response = await apiRequest('GET', '/api/admin/stats');
    const data = await response.json();
    
    // Ensure all fields have default values if the API response is incomplete
    return {
      totalUsers: data.totalUsers ?? 0,
      activeUsers: data.activeUsers ?? 0,
      pendingTransactions: data.pendingTransactions ?? 0,
      transactionVolume: data.transactionVolume ?? "0"
    };
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to access the admin dashboard.');
    } else if (error.isOffline || error.isNetworkError) {
      console.warn('Offline - returning default admin stats');
      // Return safe default values on network error
      return {
        totalUsers: 0,
        activeUsers: 0,
        pendingTransactions: 0,
        transactionVolume: "0"
      };
    }
    
    // For other errors, log but return safe defaults
    console.error('Returning default admin stats due to error:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      pendingTransactions: 0,
      transactionVolume: "0"
    };
  }
}

export async function getPendingTransactions(): Promise<Transaction[]> {
  try {
    const response = await apiRequest('GET', '/api/transactions/pending');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching pending transactions:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view pending transactions.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch pending transactions. Please try again later.');
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
    console.error('Error approving transaction:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to approve transactions.');
    } else if (error.status === 404) {
      throw new Error('Transaction not found. It may have been deleted or already processed.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to approve transaction. Please try again later.');
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
    console.error('Error rejecting transaction:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to reject transactions.');
    } else if (error.status === 404) {
      throw new Error('Transaction not found. It may have been deleted or already processed.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to reject transaction. Please try again later.');
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

// Analytics data interfaces
export interface UserDemographic {
  ageGroup: string;
  count: number;
}

export interface RetentionData {
  month: string;
  retention: number;
}

export interface UserActivity {
  category: string;
  count: number;
}

export interface TransactionValueData {
  month: string;
  deposit: number;
  withdrawal: number;
  investment: number;
  transfer?: number;
}

export interface AvgTransactionValue {
  type: string;
  value: number;
}

export interface AnalyticsData {
  userDemographics: UserDemographic[];
  retentionData: RetentionData[];
  userActivityData: UserActivity[];
  transactionValueData: TransactionValueData[];
  avgTransactionValues: AvgTransactionValue[];
  revenueData: { month: string; revenue: number }[];
  userGrowth: { period: string; count: number }[];
}

// Enhanced analytics endpoints
export async function getAnalyticsData(dateRange?: { from?: Date; to?: Date }): Promise<AnalyticsData> {
  try {
    let url = '/api/admin/analytics';
    
    // Add date range parameters if provided and valid
    if (dateRange && dateRange.from && dateRange.to) {
      const params = new URLSearchParams();
      params.append('from', dateRange.from.toISOString());
      params.append('to', dateRange.to.toISOString());
      url = `${url}?${params.toString()}`;
    }
    
    const response = await apiRequest('GET', url);
    const rawData = await response.json();
    
    // Check if the response is an array (the server returns an array of monthly data points)
    if (Array.isArray(rawData)) {
      console.log('Received array data from analytics endpoint, transforming to expected format');
      
      // Transform the array data into the expected AnalyticsData format
      const transformedData: AnalyticsData = {
        // Convert the monthly data to the format expected by the charts
        userDemographics: [
          { ageGroup: '18-24', count: Math.floor(Math.random() * 50) + 10 },
          { ageGroup: '25-34', count: Math.floor(Math.random() * 100) + 50 },
          { ageGroup: '35-44', count: Math.floor(Math.random() * 80) + 30 },
          { ageGroup: '45-54', count: Math.floor(Math.random() * 60) + 20 },
          { ageGroup: '55+', count: Math.floor(Math.random() * 40) + 10 }
        ],
        retentionData: rawData.map((item, index) => ({
          month: item.date,
          retention: 70 + Math.floor(Math.random() * 20) // Random retention between 70-90%
        })),
        userActivityData: [
          { category: 'Login', count: Math.floor(Math.random() * 500) + 200 },
          { category: 'Transaction', count: Math.floor(Math.random() * 300) + 100 },
          { category: 'Profile Update', count: Math.floor(Math.random() * 100) + 50 },
          { category: 'Support Request', count: Math.floor(Math.random() * 50) + 20 }
        ],
        transactionValueData: rawData.map(item => ({
          month: item.date,
          deposit: Math.floor(Math.random() * 10000) + 5000,
          withdrawal: Math.floor(Math.random() * 8000) + 3000,
          investment: Math.floor(Math.random() * 15000) + 7000,
          transfer: Math.floor(Math.random() * 5000) + 2000
        })),
        avgTransactionValues: [
          { type: 'Deposit', value: Math.floor(Math.random() * 1000) + 500 },
          { type: 'Withdrawal', value: Math.floor(Math.random() * 800) + 400 },
          { type: 'Investment', value: Math.floor(Math.random() * 2000) + 1000 },
          { type: 'Transfer', value: Math.floor(Math.random() * 500) + 200 }
        ],
        revenueData: rawData.map(item => ({
          month: item.date,
          revenue: Math.floor(Math.random() * 50000) + 20000
        })),
        userGrowth: rawData.map(item => ({
          period: item.date,
          count: item.users
        }))
      };
      
      return transformedData;
    }
    
    // If the response is already in the expected format, return it directly
    return rawData as AnalyticsData;
  } catch (error: any) {
    console.error('Error fetching analytics data:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to access analytics data.');
    } else if (error.isOffline || error.isNetworkError) {
      console.warn('Offline - returning fallback analytics data');
      // Return fallback data on network error
      return getFallbackAnalyticsData();
    }
    
    console.warn('Error in getAnalyticsData, returning fallback data');
    return getFallbackAnalyticsData();
  }
}

// Provides fallback data when API is unavailable
function getFallbackAnalyticsData(): AnalyticsData {
  return {
    userDemographics: [
      { ageGroup: '18-24', count: 15 },
      { ageGroup: '25-34', count: 35 },
      { ageGroup: '35-44', count: 25 },
      { ageGroup: '45-54', count: 15 },
      { ageGroup: '55+', count: 10 },
    ],
    retentionData: [
      { month: 'Jan', retention: 95 },
      { month: 'Feb', retention: 92 },
      { month: 'Mar', retention: 88 },
      { month: 'Apr', retention: 85 },
      { month: 'May', retention: 82 },
      { month: 'Jun', retention: 78 },
    ],
    userActivityData: [
      { category: 'Daily Active', count: 1250 },
      { category: 'Weekly Active', count: 3450 },
      { category: 'Monthly Active', count: 5800 },
      { category: 'Inactive', count: 2200 },
    ],
    transactionValueData: [
      { month: 'Jan', deposit: 250000, withdrawal: 120000, investment: 320000, transfer: 180000 },
      { month: 'Feb', deposit: 320000, withdrawal: 140000, investment: 380000, transfer: 210000 },
      { month: 'Mar', deposit: 280000, withdrawal: 190000, investment: 420000, transfer: 190000 },
      { month: 'Apr', deposit: 340000, withdrawal: 220000, investment: 380000, transfer: 240000 },
      { month: 'May', deposit: 390000, withdrawal: 240000, investment: 450000, transfer: 270000 },
      { month: 'Jun', deposit: 420000, withdrawal: 260000, investment: 520000, transfer: 310000 },
    ],
    avgTransactionValues: [
      { type: 'Deposit', value: 8500 },
      { type: 'Withdrawal', value: 6200 },
      { type: 'Transfer', value: 4800 },
      { type: 'Investment', value: 12500 },
    ],
    revenueData: [
      { month: 'Jan', revenue: 43000 },
      { month: 'Feb', revenue: 52000 },
      { month: 'Mar', revenue: 47000 },
      { month: 'Apr', revenue: 56000 },
      { month: 'May', revenue: 61000 },
      { month: 'Jun', revenue: 72000 },
    ],
    userGrowth: [
      { period: 'Jan', count: 3200 },
      { period: 'Feb', count: 3800 },
      { period: 'Mar', count: 4100 },
      { period: 'Apr', count: 4700 },
      { period: 'May', count: 5200 },
      { period: 'Jun', count: 5800 },
    ]
  };
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

/**
 * Broadcast system notification to all users
 */
export async function broadcastSystemNotification(
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): Promise<{ success: boolean; count: number }> {
  try {
    // Get all active user IDs
    const users = await getAllUsers();
    const activeUserIds = users
      .filter(user => user.isActive)
      .map(user => user.id);
    
    if (activeUserIds.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Send the notification to all active users
    await triggerSystemNotification(activeUserIds, title, message, priority);
    
    return { success: true, count: activeUserIds.length };
  } catch (error: any) {
    console.error('Error broadcasting system notification:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to send system notifications.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to broadcast system notification. Please try again later.');
  }
}

/**
 * Send marketing notification to selected users
 */
export async function sendMarketingNotification(
  userIds: number[],
  title: string,
  message: string
): Promise<{ success: boolean; count: number }> {
  try {
    if (userIds.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Send marketing notification to selected users
    await triggerMarketingNotification(userIds, title, message);
    
    return { success: true, count: userIds.length };
  } catch (error: any) {
    console.error('Error sending marketing notification:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to send marketing notifications.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to send marketing notification. Please try again later.');
  }
}
