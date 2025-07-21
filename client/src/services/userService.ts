import { User, Transaction } from '@shared/schema';

// Define UserRole type since it's not in the schema
type UserRole = 'user' | 'manager' | 'support';

import { apiRequest } from '@/lib/queryClient';

export type UserFilters = {
  role?: UserRole;
  isVerified?: boolean;
  isActive?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
};

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId?: number | string): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('GET', `/api/users/${userId}/profile`);
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Unexpected response format: ${text}`);
    }
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to view this profile.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to fetch user profile. Please try again later.');
  }
}

/**
 * Get user activity log
 */
export async function getUserActivity(userId?: number | string): Promise<any[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('GET', `/api/users/${userId}/activity`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching user activity:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to view this activity log.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to fetch user activity. Please try again later.');
  }
}

/**
 * Get user balance
 */
export async function getUserBalance(userId?: number | string): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('GET', `/api/users/${userId}/balance`);
    return await response.json();
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
 * Update user profile
 */
export async function updateUserProfile(userId?: number | string, data?: any): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/profile`, data);
    return await response.json();
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid profile data. Please check your inputs.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to update this profile.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to update user profile. Please try again later.');
  }
}

/**
 * Update user profile with general data
 */
export async function updateUserProfileGeneral(userId?: number | string, data?: any): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/profile`, data);
    return await response.json();
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid profile data. Please check your inputs.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to update this profile.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to update user profile. Please try again later.');
  }
}

/**
 * Update user security settings
 */
export async function updateUserSecurity(userId?: number | string, data?: any): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/security`, data);
    return await response.json();
  } catch (error: any) {
    console.error('Error updating security settings:', error);
    if (error.message === 'Current password is incorrect') {
      throw new Error('Current password is incorrect. Please try again.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid security data. Please check your inputs.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to update security settings.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to update security settings. Please try again later.');
  }
}

/**
 * Update user notification preferences
 */
export async function updateUserNotifications(userId?: number | string, data?: any): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/notifications`, data);
    return await response.json();
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    if (error.status === 400) {
      throw new Error(error.message || 'Invalid notification data. Please check your inputs.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to update notification preferences.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to update notification preferences. Please try again later.');
  }
}

/**
 * Get user referrals
 */
export async function getUserReferrals(userId?: number | string): Promise<any[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('GET', `/api/users/${userId}/referrals`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching user referrals:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to view these referrals.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to fetch user referrals. Please try again later.');
  }
}

/**
 * Get user referral statistics
 */
export async function getUserReferralStats(userId?: number | string): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const response = await apiRequest('GET', `/api/users/${userId}/referral-stats`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching referral stats:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to view these referral statistics.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to fetch referral statistics. Please try again later.');
  }
}

/**
 * Get a single user by ID
 */
export async function getUser(userId: number): Promise<User> {
  try {
    const response = await apiRequest('GET', `/api/users/${userId}`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching user:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to view this user profile.');
    } else if (error.status === 404) {
      throw new Error('User not found. The user may have been deleted or you may not have access.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to fetch user information. Please try again later.');
  }
}

/**
 * Get all users with optional filtering, pagination and sorting
 */
export async function getUsers(filters: UserFilters = {}): Promise<{
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.isVerified !== undefined) queryParams.append('isVerified', String(filters.isVerified));
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.order) queryParams.append('order', filters.order);

    const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest('GET', url);

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching users:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to view user data.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to fetch users. Please try again later.');
  }
}

/**
 * Get user transactions with optional filtering
 */
export async function getUserTransactions(
  userId: number,
  filters: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));

    const url = `/api/users/${userId}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest('GET', url);

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching user transactions:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to view these transactions.');
    } else if (error.status === 404) {
      throw new Error('User not found. The user may have been deleted or you may not have access.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to fetch transactions. Please try again later.');
  }
}

/**
 * Update user profile with specific user data
 */
export async function updateUserProfileDetails(userId: number, profileData: Partial<User>): Promise<User> {
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}`, profileData);
    const updatedUser = await response.json();

    return updatedUser;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.status === 403) {
      throw new Error('You do not have permission to update this user profile.');
    } else if (error.status === 404) {
      throw new Error('User not found. The user may have been deleted or you may not have access.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid profile data. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw new Error(error.message || 'Failed to update user profile. Please try again later.');
  }
}

/**
 * Get user dashboard statistics
 */
export async function getDashboardStats(userId: number): Promise<{
  balance: string;
  pendingTransactions: number;
  completedTransactions: number;
  totalInvestment: string;
  monthlyProfit: string;
  yearlyProfit: string;
  portfolioPerformance: {
    labels: string[];
    data: number[];
  };
}> {
  try {
    const response = await apiRequest('GET', `/api/users/${userId}/dashboard-stats`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: Failed to fetch dashboard statistics`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error(error.message || 'Failed to fetch dashboard statistics');
  }
}

/**
 * Update user password - requires old password verification
 */
export async function updatePassword(
  userId: number,
  data: { currentPassword: string; newPassword: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('POST', `/api/users/${userId}/change-password`, data);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: Failed to update password`);
    }

    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return {
      success: false,
      message: error.message || 'Failed to update password'
    };
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: number,
  preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
    transactionAlerts?: boolean;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/notification-preferences`, preferences);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: Failed to update notification preferences`
      );
    }

    return {
      success: true,
      message: 'Notification preferences updated successfully'
    };
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return {
      success: false,
      message: error.message || 'Failed to update notification preferences'
    };
  }
}
