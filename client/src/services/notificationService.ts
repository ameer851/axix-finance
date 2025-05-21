import { Notification, InsertNotification, NotificationType, NotificationPriority } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export type NotificationFilters = {
  userId?: number;
  read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

// Alert settings type definitions
export type AlertSetting = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

/**
 * Get all notifications for the current user
 */
export async function getNotifications(filters: NotificationFilters = {}): Promise<{
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}> {
  try {
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();
    
    if (filters.userId) queryParams.append('userId', String(filters.userId));
    if (filters.read !== undefined) queryParams.append('read', String(filters.read));
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    
    const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest('GET', url);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    
    if (error.status === 401) {
      throw new Error('You must be logged in to view notifications.');
    } else if (error.isOffline || error.isNetworkError) {
      // Return empty notifications for offline mode
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
        page: 1,
        totalPages: 0
      };
    }
    
    throw new Error(error.message || 'Failed to fetch notifications. Please try again later.');
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await apiRequest('GET', '/api/notifications/unread-count');
    const data = await response.json();
    return data.count;
  } catch (error: any) {
    console.error('Error fetching unread notification count:', error);
    
    if (error.status === 401) {
      throw new Error('You must be logged in to view notifications.');
    } else if (error.isOffline || error.isNetworkError) {
      // Return 0 for offline scenarios
      console.warn('Network issue - returning 0 unread notifications');
      return 0;
    }
    
    // Also return 0 for other errors to avoid breaking the UI
    console.error('Returning 0 due to error:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<Notification> {
  try {
    const response = await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    return await response.json();
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    
    if (error.status === 404) {
      throw new Error('Notification not found. It may have been deleted.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to update this notification.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to mark notification as read. Please try again later.');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ count: number }> {
  try {
    const response = await apiRequest('PATCH', '/api/notifications/mark-all-read');
    return await response.json();
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to update notifications.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to mark all notifications as read. Please try again later.');
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number): Promise<boolean> {
  try {
    await apiRequest('DELETE', `/api/notifications/${notificationId}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    
    if (error.status === 404) {
      throw new Error('Notification not found.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to delete this notification.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to delete notification. Please try again later.');
  }
}

/**
 * Delete all notifications for the current user
 */
export async function deleteAllNotifications(userId?: number): Promise<boolean> {
  try {
    const url = userId ? `/api/notifications/all/${userId}` : '/api/notifications/all';
    await apiRequest('DELETE', url);
    return true;
  } catch (error: any) {
    console.error('Error deleting all notifications:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to delete all notifications.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to delete all notifications. Please try again later.');
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
  notificationTypes?: Record<NotificationType, boolean>;
}): Promise<{
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  notificationTypes: Record<NotificationType, boolean>;
}> {
  try {
    const response = await apiRequest('PATCH', '/api/user/notification-preferences', preferences);
    return await response.json();
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    
    if (error.status === 401) {
      throw new Error('You must be logged in to update notification preferences.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to update notification preferences. Please try again later.');
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<{
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  notificationTypes: Record<NotificationType, boolean>;
}> {
  try {
    const response = await apiRequest('GET', '/api/user/notification-preferences');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    
    if (error.status === 401) {
      throw new Error('You must be logged in to view notification preferences.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch notification preferences. Please try again later.');
  }
}

/**
 * Create a notification (admin only)
 */
export async function createNotification(notificationData: InsertNotification): Promise<Notification> {
  try {
    const response = await apiRequest('POST', '/api/notifications', notificationData);
    return await response.json();
  } catch (error: any) {
    console.error('Error creating notification:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to create notifications.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid notification data. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to create notification. Please try again later.');
  }
}

/**
 * Create bulk notifications (admin only)
 */
export async function createBulkNotifications(
  notifications: InsertNotification[]
): Promise<{ count: number; success: boolean }> {
  try {
    const response = await apiRequest('POST', '/api/notifications/bulk', { notifications });
    return await response.json();
  } catch (error: any) {
    console.error('Error creating bulk notifications:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to create notifications.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid notification data. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to create notifications. Please try again later.');
  }
}

/**
 * Get notification title based on type
 */
export function getNotificationTitle(notification: Notification): string {
  if (notification.title) {
    return notification.title;
  }
  
  const titles: Record<NotificationType, string> = {
    transaction: 'Transaction Update',
    account: 'Account Update',
    security: 'Security Alert',
    marketing: 'Special Offer',
    system: 'System Notification',
    verification: 'Verification Update'
  };
  
  return titles[notification.type] || 'Notification';
}

/**
 * Get notification icon based on type and priority
 */
export function getNotificationIcon(notification: Notification): string {
  const icons: Record<NotificationType, string> = {
    transaction: 'dollar-sign',
    account: 'user',
    security: 'shield',
    marketing: 'tag',
    system: 'info',
    verification: 'check-circle'
  };
  
  // Add priority indicator for high priority notifications
  if (notification.priority === 'high') {
    return `alert-${icons[notification.type] || 'circle'}`;
  }
  
  return icons[notification.type] || 'bell';
}

/**
 * Get notification color based on priority
 */
export function getNotificationColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    low: 'blue',
    medium: 'yellow',
    high: 'red'
  };
  
  return colors[priority] || 'blue';
}

/**
 * Get user alert settings
 */
export async function getAlertSettings(userId: number): Promise<AlertSetting[]> {
  try {
    const response = await apiRequest('GET', `/api/users/${userId}/alert-settings`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching alert settings:', error);
    
    if (error.status === 401) {
      throw new Error('You must be logged in to view alert settings.');
    } else if (error.status === 404) {
      throw new Error('User not found.');
    } else if (error.isOffline || error.isNetworkError) {
      // Return default alert settings for offline mode
      return [
        {
          id: 'price_alerts',
          name: 'Price Alerts',
          description: 'Notifications when securities reach your target price',
          enabled: true
        },
        {
          id: 'market_news',
          name: 'Market News',
          description: 'Important news about the market and your holdings',
          enabled: true
        },
        {
          id: 'deposit_withdrawal',
          name: 'Deposits & Withdrawals',
          description: 'Notifications about account funding activities',
          enabled: true
        },
        {
          id: 'trade_confirmations',
          name: 'Trade Confirmations',
          description: 'Confirmations when your trades are executed',
          enabled: true
        },
        {
          id: 'dividend_payments',
          name: 'Dividend Payments',
          description: 'Notifications about dividend payments',
          enabled: true
        },
        {
          id: 'account_statements',
          name: 'Account Statements',
          description: 'Notifications when new statements are available',
          enabled: false
        },
        {
          id: 'tax_documents',
          name: 'Tax Documents',
          description: 'Notifications when tax documents are ready',
          enabled: true
        }
      ];
    }
    
    throw new Error(error.message || 'Failed to fetch alert settings. Please try again later.');
  }
}

/**
 * Update an alert setting
 */
export async function updateAlertSetting(userId: number, settingId: string, enabled: boolean): Promise<AlertSetting> {
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}/alert-settings/${settingId}`, {
      enabled
    });
    return await response.json();
  } catch (error: any) {
    console.error('Error updating alert setting:', error);
    
    if (error.status === 401) {
      throw new Error('You must be logged in to update alert settings.');
    } else if (error.status === 404) {
      throw new Error('Setting not found.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to update this setting.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('You are currently offline. Please try again when you have an internet connection.');
    }
    
    throw new Error(error.message || 'Failed to update alert setting. Please try again later.');
  }
}
