import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotification,
  createBulkNotifications,
  getNotificationTitle,
  getNotificationIcon,
  getNotificationColor
} from '../notificationService';
import { apiRequest } from '@/lib/queryClient';

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn()
}));

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('getNotifications', () => {
    it('should fetch notifications with no filters', async () => {
      const mockResponse = {
        json: () => Promise.resolve({
          notifications: [],
          total: 0,
          unreadCount: 0,
          page: 1,
          totalPages: 1
        })
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await getNotifications();
      
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/notifications');
      expect(result).toEqual({
        notifications: [],
        total: 0,
        unreadCount: 0,
        page: 1,
        totalPages: 1
      });
    });
    
    it('should fetch notifications with filters', async () => {
      const filters = {
        read: false,
        type: 'transaction' as const,
        page: 1,
        limit: 10
      };
      
      const mockResponse = {
        json: () => Promise.resolve({
          notifications: [{ id: 1, message: 'Test' }],
          total: 1,
          unreadCount: 1,
          page: 1,
          totalPages: 1
        })
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await getNotifications(filters);
      
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/notifications?read=false&type=transaction&page=1&limit=10');
      expect(result.notifications).toHaveLength(1);
    });
    
    it('should handle API errors correctly', async () => {
      const error = {
        status: 401,
        message: 'Unauthorized'
      };
      
      vi.mocked(apiRequest).mockRejectedValueOnce(error);
      
      await expect(getNotifications()).rejects.toThrow('You must be logged in to view notifications.');
    });
    
    it('should handle network errors correctly', async () => {
      const error = {
        isOffline: true,
        message: 'Network error'
      };
      
      vi.mocked(apiRequest).mockRejectedValueOnce(error);
      
      const result = await getNotifications();
      
      expect(result).toEqual({
        notifications: [],
        total: 0,
        unreadCount: 0,
        page: 1,
        totalPages: 0
      });
    });
  });
  
  describe('getUnreadNotificationCount', () => {
    it('should fetch unread notification count', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ count: 5 })
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await getUnreadNotificationCount();
      
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/notifications/unread-count');
      expect(result).toBe(5);
    });
    
    it('should return 0 for network errors', async () => {
      const error = {
        isOffline: true,
        message: 'Network error'
      };
      
      vi.mocked(apiRequest).mockRejectedValueOnce(error);
      
      const result = await getUnreadNotificationCount();
      
      expect(result).toBe(0);
    });
  });
  
  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 1;
      const updatedNotification = { id: 1, read: true };
      
      const mockResponse = {
        json: () => Promise.resolve(updatedNotification)
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await markNotificationAsRead(notificationId);
      
      expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/notifications/1/read');
      expect(result).toEqual(updatedNotification);
    });
    
    it('should handle not found errors', async () => {
      const notificationId = 999;
      const error = {
        status: 404,
        message: 'Notification not found'
      };
      
      vi.mocked(apiRequest).mockRejectedValueOnce(error);
      
      await expect(markNotificationAsRead(notificationId)).rejects.toThrow('Notification not found. It may have been deleted.');
    });
  });
  
  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockResponse = {
        json: () => Promise.resolve({ count: 3 })
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await markAllNotificationsAsRead();
      
      expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/notifications/mark-all-read');
      expect(result).toEqual({ count: 3 });
    });
  });
  
  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = 1;
      
      vi.mocked(apiRequest).mockResolvedValueOnce({} as any);
      
      const result = await deleteNotification(notificationId);
      
      expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/notifications/1');
      expect(result).toBe(true);
    });
  });
  
  describe('getNotificationPreferences', () => {
    it('should fetch notification preferences', async () => {
      const mockPreferences = {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        notificationTypes: {
          transaction: true,
          account: true,
          security: true,
          marketing: false,
          system: true,
          verification: true
        }
      };
      
      const mockResponse = {
        json: () => Promise.resolve(mockPreferences)
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await getNotificationPreferences();
      
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/notifications/preferences');
      expect(result).toEqual(mockPreferences);
    });
  });
  
  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        emailNotifications: true,
        pushNotifications: false
      };
      
      const mockResponse = {
        json: () => Promise.resolve({
          ...preferences,
          smsNotifications: false,
          marketingEmails: false,
          notificationTypes: {}
        })
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await updateNotificationPreferences(preferences);
      
      expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/notifications/preferences', preferences);
      expect(result).toEqual({
        ...preferences,
        smsNotifications: false,
        marketingEmails: false,
        notificationTypes: {}
      });
    });
  });
  
  describe('createNotification', () => {
    it('should create a notification', async () => {
      const notificationData = {
        userId: 1,
        type: 'transaction' as const,
        message: 'Test notification'
      };
      
      const createdNotification = {
        ...notificationData,
        id: 1,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      const mockResponse = {
        json: () => Promise.resolve(createdNotification)
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await createNotification(notificationData);
      
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/notifications', notificationData);
      expect(result).toEqual(createdNotification);
    });
  });
  
  describe('createBulkNotifications', () => {
    it('should create multiple notifications', async () => {
      const notifications = [
        {
          userId: 1,
          type: 'transaction' as const,
          message: 'Test notification 1'
        },
        {
          userId: 2,
          type: 'security' as const,
          message: 'Test notification 2'
        }
      ];
      
      const mockResponse = {
        json: () => Promise.resolve({ count: 2, success: true })
      };
      
      vi.mocked(apiRequest).mockResolvedValueOnce(mockResponse as any);
      
      const result = await createBulkNotifications(notifications);
      
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/notifications/bulk', { notifications });
      expect(result).toEqual({ count: 2, success: true });
    });
  });
  
  describe('Utility functions', () => {
    it('getNotificationTitle should return correct title', () => {
      const notification = {
        id: 1,
        type: 'transaction' as const,
        message: 'Test notification',
        userId: 1,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      expect(getNotificationTitle(notification)).toBe('Transaction Update');
      
      const notificationWithCustomTitle = {
        ...notification,
        title: 'Custom Title'
      };
      
      expect(getNotificationTitle(notificationWithCustomTitle)).toBe('Custom Title');
    });
    
    it('getNotificationIcon should return correct icon', () => {
      const notification = {
        id: 1,
        type: 'security' as const,
        message: 'Test notification',
        userId: 1,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      expect(getNotificationIcon(notification)).toBe('shield');
      
      const highPriorityNotification = {
        ...notification,
        priority: 'high' as const
      };
      
      expect(getNotificationIcon(highPriorityNotification)).toBe('alert-shield');
    });
    
    it('getNotificationColor should return correct color', () => {
      expect(getNotificationColor('low')).toBe('blue');
      expect(getNotificationColor('medium')).toBe('green');
      expect(getNotificationColor('high')).toBe('red');
    });
  });
});
