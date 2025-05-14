import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdateNotificationPreferences
} from '../useNotifications';
import * as notificationService from '../../services/notificationService';

// Explicitly cast mock data to the Notification type
const mockNotificationsResponse = {
  notifications: [
    {
      id: 1,
      userId: 1,
      type: 'transaction' as 'transaction', // Explicitly cast to allowed value
      title: 'Transaction Alert',
      message: 'Your transaction was successful.',
      isRead: false,
      priority: 'medium' as 'medium', // Explicitly cast to allowed value
      relatedEntityType: null,
      relatedEntityId: null,
      createdAt: new Date(),
      expiresAt: null,
    },
  ],
  total: 1,
  unreadCount: 1,
  page: 1,
  totalPages: 1,
};

vi.mock('../../services/notificationService', () => ({
  getNotifications: vi.fn().mockResolvedValue(mockNotificationsResponse),
  getUnreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
}));

// Replaced JSX with plain JavaScript to isolate the issue
const createWrapper = () => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement('div', null, children);
  };
};

describe('Notification Hooks', () => {
  let wrapper: ReturnType<typeof createWrapper>;
  
  beforeEach(() => {
    wrapper = createWrapper();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('useNotifications', () => {
    it('should initialize with an empty notifications array', () => {
      const { result } = renderHook(() => useNotifications(1));
      expect(result.current.notifications).toEqual([]);
    });

    it('should return WebSocket properties', () => {
      const { result } = renderHook(() => useNotifications(1));
      expect(result.current.isConnected).toBeDefined();
      expect(result.current.sendMessage).toBeInstanceOf(Function);
      expect(result.current.connectionAttempts).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('useUnreadNotificationsCount', () => {
    it('should fetch and return unread notification count', async () => {
      vi.mocked(notificationService.getUnreadNotificationCount).mockResolvedValueOnce(5);
      
      const { result } = renderHook(() => useUnreadNotificationsCount(), { wrapper });
      
      await waitFor(() => {
        expect(result.current).toBe(5);
      });
      
      expect(notificationService.getUnreadNotificationCount).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('useMarkAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 1;
      const updatedNotification = {
        id: 1,
        userId: 1,
        type: 'transaction' as 'transaction',
        title: 'Transaction Alert',
        message: 'Your transaction was successful.',
        isRead: true,
        priority: 'medium' as 'medium',
        relatedEntityType: null,
        relatedEntityId: null,
        createdAt: new Date(),
        expiresAt: null,
      };
      
      vi.mocked(notificationService.markNotificationAsRead).mockResolvedValueOnce(updatedNotification);
      
      const { result } = renderHook(() => useMarkAsRead(), { wrapper });
      
      expect(result.current.isPending).toBe(false);
      
      result.current.mutate(notificationId);
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      
      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith(notificationId);
    });
  });
  
  describe('useMarkAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(notificationService.markAllNotificationsAsRead).mockResolvedValueOnce({ count: 3 });
      
      const { result } = renderHook(() => useMarkAllAsRead(), { wrapper });
      
      result.current.mutate();
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      
      expect(notificationService.markAllNotificationsAsRead).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('useDeleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = 1;
      
      vi.mocked(notificationService.deleteNotification).mockResolvedValueOnce(true);
      
      const { result } = renderHook(() => useDeleteNotification(), { wrapper });
      
      result.current.mutate(notificationId);
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      
      expect(notificationService.deleteNotification).toHaveBeenCalledWith(notificationId);
    });
  });
  
  describe('useNotificationPreferences', () => {
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
      
      vi.mocked(notificationService.getNotificationPreferences).mockResolvedValueOnce(mockPreferences);
      
      const { result } = renderHook(() => useNotificationPreferences(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      
      expect(result.current.data).toEqual(mockPreferences);
      expect(notificationService.getNotificationPreferences).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('useUpdateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: true,
        marketingEmails: true,
        notificationTypes: {
          transaction: true,
          account: false,
          security: true,
          marketing: true,
          system: false,
          verification: true
        }
      };
      
      vi.mocked(notificationService.updateNotificationPreferences).mockResolvedValueOnce(preferences);
      
      const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper });
      
      result.current.mutate(preferences);
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      
      expect(notificationService.updateNotificationPreferences).toHaveBeenCalledWith(preferences);
    });
  });
});
