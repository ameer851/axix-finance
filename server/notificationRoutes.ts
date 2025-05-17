import express from 'express';
import { DatabaseStorage } from './storage';

// Create a storage instance
const storage = new DatabaseStorage();
import { requireEmailVerification, isAdmin } from './auth';
import { z } from 'zod';
import { InsertNotification, NotificationType, NotificationPriority } from '@shared/schema';
import { sendNotification } from './websocketServer';

const router = express.Router();

// Get all notifications for the current user with pagination
router.get('/', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 items per page
    const offset = (page - 1) * limit;
    
    // Parse filter parameters
    const type = req.query.type as NotificationType | undefined;
    const priority = req.query.priority as NotificationPriority | undefined;
    const read = req.query.read ? req.query.read === 'true' : undefined;
    
    const { notifications, total } = await storage.getUserNotifications(userId, {
      type,
      priority,
      read,
      offset,
      limit
    });
    
    const unreadCount = await storage.getUnreadNotificationCount(userId);
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
      notifications,
      total,
      unreadCount,
      page,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count for the current user
router.get('/unread-count', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const count = await storage.getUnreadNotificationCount(userId);
    
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return res.status(500).json({ message: 'Failed to fetch unread notification count' });
  }
});

// Mark a notification as read
router.patch('/:id/read', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const notification = await storage.getNotification(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to access this notification' });
    }
    
    const updatedNotification = await storage.markNotificationAsRead(notificationId);
    
    return res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for the current user
router.patch('/mark-all-read', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const count = await storage.markAllNotificationsAsRead(userId);
    
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Delete a notification
router.delete('/:id', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const notification = await storage.getNotification(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Only allow the user to delete their own notifications or admins to delete any
    if (notification.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to delete this notification' });
    }
    
    await storage.deleteNotification(notificationId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Create a notification (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number(),
      type: z.enum(['transaction', 'account', 'security', 'marketing', 'system', 'verification']),
      title: z.string().min(1).max(100),
      message: z.string().min(1).max(500),
      priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
      relatedEntityType: z.string().optional(),
      relatedEntityId: z.number().optional(),
      expiresAt: z.string().optional()
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid notification data', 
        errors: validationResult.error.errors 
      });
    }
    
    const notificationData = validationResult.data;
    
    // Check if the user exists
    const user = await storage.getUser(notificationData.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const notification = await storage.createNotification(notificationData as InsertNotification);
    
    return res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ message: 'Failed to create notification' });
  }
});

// Create bulk notifications (admin only)
router.post('/bulk', isAdmin, async (req, res) => {
  try {
    const schema = z.object({
      notifications: z.array(
        z.object({
          userId: z.number(),
          type: z.enum(['transaction', 'account', 'security', 'marketing', 'system', 'verification']),
          title: z.string().min(1).max(100),
          message: z.string().min(1).max(500),
          priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
          relatedEntityType: z.string().optional(),
          relatedEntityId: z.number().optional(),
          expiresAt: z.string().optional()
        })
      )
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid notification data', 
        errors: validationResult.error.errors 
      });
    }
    
    const { notifications } = validationResult.data;
    
    if (notifications.length === 0) {
      return res.status(400).json({ message: 'No notifications provided' });
    }
    
    const count = await storage.createBulkNotifications(notifications as InsertNotification[]);
    
    return res.status(201).json({ count, success: true });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return res.status(500).json({ message: 'Failed to create bulk notifications' });
  }
});

// Get user notification preferences
router.get('/preferences', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const preferences = await storage.getNotificationPreferences(userId);
    
    if (!preferences) {
      // Return default preferences if none exist
      return res.status(200).json({
        emailNotifications: true,
        pushNotifications: false,
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
      });
    }
    
    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return res.status(500).json({ message: 'Failed to fetch notification preferences' });
  }
});

// Update user notification preferences
router.patch('/preferences', requireEmailVerification, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const schema = z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      notificationTypes: z.record(z.boolean()).optional()
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid preference data', 
        errors: validationResult.error.errors 
      });
    }
    
    const preferences = validationResult.data;
    const updatedPreferences = await storage.updateNotificationPreferences(userId, preferences);
    
    return res.status(200).json(updatedPreferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({ message: 'Failed to update notification preferences' });  }
});

// Helper function to create a notification and send it via WebSocket
export async function createAndSendNotification(notification: InsertNotification) {
  try {
    // First, store the notification in the database
    const createdNotification = await storage.createNotification(notification);
    
    if (createdNotification) {
      // Then try to send it via WebSocket if the user is connected
      sendNotification(notification.userId, {
        ...createdNotification,
        title: notification.title || 'New notification',
        message: notification.message
      });
    }
    
    return createdNotification;
  } catch (error) {
    console.error('Failed to create and send notification:', error);
    return null;
  }
}

export default router;
