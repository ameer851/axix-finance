import { User, Transaction } from '@shared/schema';

// Define UserRole type since it's not in the schema
type UserRole = 'admin' | 'user' | 'manager' | 'support';

import { apiRequest } from '@/lib/queryClient';
import { triggerSecurityNotification, triggerAccountNotification } from '@/lib/notificationTriggers';

// Mock data for development
const MOCK_USER_PROFILE = {
  id: 1,
  firstName: 'Fiona',
  lastName: '500',
  email: 'fiona500@example.com',
  phone: '+1 (555) 123-4567',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'United States',
  dateOfBirth: '1990-01-01',
  isVerified: true,
  accountType: 'Standard',
  status: 'active',
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
  lastLogin: new Date().toISOString(),
  totalDeposits: 3500,
  totalWithdrawals: 1500,
  transactionCount: 12,
  twoFactorEnabled: false,
  passwordLastChanged: new Date(Date.now() - 86400000 * 60).toISOString(), // 60 days ago
  loginNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: false,
  marketingEmailsEnabled: true,
  transactionAlertsEnabled: true
};

const MOCK_USER_ACTIVITY = [
  {
    id: 1,
    userId: 1,
    action: 'Login',
    description: 'Successful login from Chrome on Windows',
    ipAddress: '192.168.1.1',
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 2,
    userId: 1,
    action: 'Password Change',
    description: 'Password changed successfully',
    ipAddress: '192.168.1.1',
    timestamp: new Date(Date.now() - 86400000 * 60).toISOString() // 60 days ago
  },
  {
    id: 3,
    userId: 1,
    action: 'Deposit',
    description: 'Deposit of $2,500.00 via Credit Card',
    ipAddress: '192.168.1.1',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: 4,
    userId: 1,
    action: 'Withdrawal Request',
    description: 'Withdrawal request of $1,000.00 via Bank Transfer',
    ipAddress: '192.168.1.1',
    timestamp: new Date().toISOString() // now
  }
];

const MOCK_REFERRALS = [
  {
    id: 101,
    userId: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    isActive: true,
    joinedAt: new Date(Date.now() - 86400000 * 20).toISOString(), // 20 days ago
    totalDeposits: 2000,
    yourEarnings: 200
  },
  {
    id: 102,
    userId: 1,
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    isActive: true,
    joinedAt: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    totalDeposits: 1500,
    yourEarnings: 150
  },
  {
    id: 103,
    userId: 1,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    isActive: false,
    joinedAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    totalDeposits: 0,
    yourEarnings: 0
  }
];

const MOCK_REFERRAL_STATS = {
  totalReferrals: 3,
  activeReferrals: 2,
  totalEarnings: 350,
  pendingEarnings: 0,
  commissionRate: '10%',
  currentTier: 'Bronze',
  nextTier: 'Silver',
  tierProgress: 35,
  referralLink: 'https://caraxfinance.com/register?ref=fiona500'
};

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
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/users/${userId}/profile`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_USER_PROFILE);
      }, 500);
    });
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
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/users/${userId}/activity`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            type: 'login',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'Login from Chrome on Windows',
            ipAddress: '192.168.1.1'
          },
          {
            id: '2',
            type: 'profile_update',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            details: 'Updated profile information',
            ipAddress: '192.168.1.1'
          },
          {
            id: '3',
            type: 'password_change',
            timestamp: new Date(Date.now() - 604800000).toISOString(),
            details: 'Changed account password',
            ipAddress: '192.168.1.1'
          },
          {
            id: '4',
            type: 'login',
            timestamp: new Date(Date.now() - 1209600000).toISOString(),
            details: 'Login from Safari on macOS',
            ipAddress: '192.168.1.2'
          },
          {
            id: '5',
            type: 'settings_update',
            timestamp: new Date(Date.now() - 2592000000).toISOString(),
            details: 'Updated notification settings',
            ipAddress: '192.168.1.1'
          }
        ]);
      }, 500);
    });
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
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/users/${userId}/balance`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          balance: '12500.75',
          availableBalance: '10200.50',
          pendingDeposits: '2300.25',
          pendingWithdrawals: '0.00',
          currency: 'USD',
          lastUpdated: new Date().toISOString()
        });
      }, 500);
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
 * Update user profile
 */
export async function updateUserProfile(userId?: number | string, data?: any): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('PATCH', `/api/users/${userId}/profile`, data);
    // return await response.json();
    
    // For development, return mock success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...MOCK_USER_PROFILE,
          ...data,
          updatedAt: new Date().toISOString()
        });
      }, 500);
    });
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
    // In a real app, this would make an API call
    // const response = await apiRequest('PATCH', `/api/users/${userId}/profile`, data);
    // return await response.json();
    
    // For development, return mock success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...MOCK_USER_PROFILE,
          ...data,
          updatedAt: new Date().toISOString()
        });
      }, 1000);
    });
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
    // In a real app, this would make an API call
    // const response = await apiRequest('PATCH', `/api/users/${userId}/security`, data);
    // return await response.json();
    
    // For development, return mock success
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate password validation if changing password
        if (data.currentPassword && data.currentPassword !== 'current-password') {
          throw new Error('Current password is incorrect');
        }
        
        resolve({
          success: true,
          message: 'Security settings updated successfully',
          twoFactorEnabled: data.twoFactorEnabled
        });
      }, 1000);
    });
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
    // In a real app, this would make an API call
    // const response = await apiRequest('PATCH', `/api/users/${userId}/notifications`, data);
    // return await response.json();
    
    // For development, return mock success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Notification preferences updated successfully',
          ...data
        });
      }, 1000);
    });
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

// This function has been moved to the top of the file

/**
 * Get user referrals
 */
export async function getUserReferrals(userId?: number | string): Promise<any[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/users/${userId}/referrals`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_REFERRALS);
      }, 500);
    });
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
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/users/${userId}/referral-stats`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_REFERRAL_STATS);
      }, 500);
    });
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
    // Convert filters to query parameters
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
    
    // Trigger notification for profile update
    triggerAccountNotification(userId, 'account_update', 'Your profile information has been updated.');
    
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
 * Delete a user account (admin only)
 */
export async function deleteUser(userId: number): Promise<boolean> {
  try {
    const response = await apiRequest('DELETE', `/api/users/${userId}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to delete this user account.');
    } else if (error.status === 404) {
      throw new Error('User not found. The user may have already been deleted.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to delete user. Please try again later.');
  }
}

/**
 * Change user account status (admin only)
 */
export async function changeUserStatus(
  userId: number, 
  status: 'active' | 'inactive' | 'suspended'
): Promise<User> {
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/status`, { status });
    const updatedUser = await response.json();
    
    // Trigger notification for account status change
    let message = '';
    switch(status) {
      case 'active':
        message = 'Your account has been activated.';
        break;
      case 'inactive':
        message = 'Your account has been deactivated.';
        break;
      case 'suspended':
        message = 'Your account has been suspended. Please contact support for more information.';
        break;
    }
    
    triggerAccountNotification(userId, 'account_update', message);
    
    return updatedUser;
  } catch (error: any) {
    console.error('Error changing user status:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to change user status.');
    } else if (error.status === 404) {
      throw new Error('User not found. The user may have been deleted.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to change user status. Please try again later.');
  }
}

/**
 * Change user role (admin only)
 */
export async function changeUserRole(userId: number, role: UserRole): Promise<User> {
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
    return await response.json();
  } catch (error: any) {
    console.error('Error changing user role:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to change user roles.');
    } else if (error.status === 404) {
      throw new Error('User not found. The user may have been deleted.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to change user role. Please try again later.');
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
