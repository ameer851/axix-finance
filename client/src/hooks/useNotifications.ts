import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import useNotificationWebSocket from './useNotificationWebSocket';
import { toast as showToast } from 'react-toastify';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationFilters,
} from '@/services/notificationService';

// Updated Notification type to include missing properties
export type Notification = {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  createdAt: Date;
  expiresAt: Date | null;
  read?: boolean; // Optional for compatibility
};

// Helper to map Notification to include `read` property for dropdown
export function mapNotificationWithRead(n: Notification): Notification {
  return {
    ...n,
    read: typeof n.read === 'boolean' ? n.read : (typeof n.isRead === 'boolean' ? n.isRead : false),
  };
}

// Query key factory
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationFilters = {}) => [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

// Hook to fetch notifications with optional filters
export function useNotifications(userId: number) {
  const { isConnected, sendMessage, connectionAttempts } = useNotificationWebSocket(userId);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [...prev, notification]);

      // Show toast notification for high-priority notifications
      if (notification.priority === 'high') {
        showToast(notification.message, {
          autoClose: 5000, // Valid property for toast
        });
      }
    };

    // Simulate receiving notifications from WebSocket
    const mockNotification: Notification = {
      id: 1,
      userId: 123,
      type: 'system',
      title: 'System Alert',
      message: 'You have a new message!',
      isRead: false,
      priority: 'high',
      relatedEntityType: null,
      relatedEntityId: null,
      createdAt: new Date(),
      expiresAt: null,
      read: false,
    };
    handleNewNotification(mockNotification);

    return () => {
      // Cleanup logic if needed
    };
  }, [isConnected]);

  return { notifications, isConnected, sendMessage, connectionAttempts };
}

// Hook to fetch unread notification count
export function useUnreadNotificationsCount() {
  const { data = 0 } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  return data;
}

// Hook to mark a notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Hook to mark all notifications as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and count
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Hook to delete a notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

// Hook to delete all notifications (with optional filter)
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Hook to fetch notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: getNotificationPreferences,
  });
}

// Hook to update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      // Invalidate and refetch preferences
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

// Hook to handle real-time updates and display notifications
export function useRealTimeNotifications() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Subscribe to WebSocket updates
  const { isConnected, sendMessage, connectionAttempts } = useNotificationWebSocket();

  useEffect(() => {
    // Update the notifications cache
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });

    // Show toast notifications for all updates
    // This logic can be extended to handle real-time notifications
  }, [queryClient, toast]);

  return { isConnected, sendMessage, connectionAttempts };
}

// Import notification component from the ui folder instead of defining it here
import NotificationDropdown from '@/components/ui/notification-dropdown';
