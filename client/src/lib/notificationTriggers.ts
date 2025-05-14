import { createNotification, NotificationType, NotificationPriority } from '@/services/notificationService';

interface TriggerNotificationOptions {
  userId: number;
  type: NotificationType;
  title?: string;
  message: string;
  priority?: NotificationPriority;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

/**
 * Trigger a notification for a user
 */
export async function triggerNotification(options: TriggerNotificationOptions) {
  const {
    userId,
    type,
    title,
    message,
    priority = 'medium',
    relatedEntityType,
    relatedEntityId,
  } = options;

  try {
    await createNotification({
      userId,
      type,
      title: title || `New ${type} notification`, // Provide a default title if undefined
      message,
      priority,
      relatedEntityType,
      relatedEntityId,
    });
    return true;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return false;
  }
}

/**
 * Trigger a transaction-related notification
 */
export async function triggerTransactionNotification(
  userId: number,
  transactionId: number,
  status: 'pending' | 'completed' | 'rejected',
  amount: string,
  type: 'deposit' | 'withdrawal' | 'transfer' | 'investment'
) {
  let message = '';
  let title = '';
  let priority: NotificationPriority = 'medium';

  switch (status) {
    case 'pending':
      title = `New ${type} request pending`;
      message = `Your ${type} request for $${amount} has been received and is being processed.`;
      break;
    case 'completed':
      title = `${type.charAt(0).toUpperCase() + type.slice(1)} completed`;
      message = `Your ${type} request for $${amount} has been successfully processed.`;
      break;
    case 'rejected':
      title = `${type.charAt(0).toUpperCase() + type.slice(1)} rejected`;
      message = `Your ${type} request for $${amount} has been rejected. Please contact support for more information.`;
      priority = 'high';
      break;
  }

  return triggerNotification({
    userId,
    type: 'transaction',
    title,
    message,
    priority,
    relatedEntityType: 'transaction',
    relatedEntityId: transactionId,
  });
}

/**
 * Trigger a security-related notification
 */
export async function triggerSecurityNotification(
  userId: number,
  event: 'login' | 'password_change' | 'profile_update' | 'suspicious_activity',
  details?: string
) {
  let message = '';
  let title = '';
  let priority: NotificationPriority = 'medium';

  switch (event) {
    case 'login':
      title = 'New login detected';
      message = `A new login was detected on your account. ${details || ''}`;
      break;
    case 'password_change':
      title = 'Password changed';
      message = 'Your password has been successfully changed.';
      break;
    case 'profile_update':
      title = 'Profile updated';
      message = 'Your profile information has been updated.';
      break;
    case 'suspicious_activity':
      title = 'Suspicious activity detected';
      message = `We've detected suspicious activity on your account. ${details || "Please contact support if this wasn't you."}`;
      priority = 'high';
      break;
  }

  return triggerNotification({
    userId,
    type: 'security',
    title: title || 'Security Alert',
    message,
    priority,
    relatedEntityType: 'user',
    relatedEntityId: userId
  });
}

/**
 * Trigger an account-related notification
 */
export async function triggerAccountNotification(
  userId: number,
  event: 'verification_requested' | 'verification_approved' | 'verification_rejected' | 'account_update',
  details?: string
) {
  let message = '';
  let title = '';
  let priority: NotificationPriority = 'medium';
  let type: NotificationType = 'account';

  switch (event) {
    case 'verification_requested':
      title = 'Verification requested';
      message = 'Your account verification request has been received. We will process it shortly.';
      type = 'verification';
      break;
    case 'verification_approved':
      title = 'Account verified';
      message = 'Congratulations! Your account has been successfully verified.';
      type = 'verification';
      priority = 'low';
      break;
    case 'verification_rejected':
      title = 'Verification rejected';
      message = `Your account verification has been rejected. ${details || 'Please contact support for more information.'}`;
      type = 'verification';
      priority = 'high';
      break;
    case 'account_update':
      title = 'Account updated';
      message = `Your account information has been updated. ${details || ''}`;
      break;
  }

  return triggerNotification({
    userId,
    type,
    title,
    message,
    priority,
    relatedEntityType: 'account',
  });
}

/**
 * Trigger a system notification (for all users or specific users)
 */
export async function triggerSystemNotification(
  userIds: number[],
  title: string,
  message: string,
  priority: NotificationPriority = 'medium'
) {
  const promises = userIds.map(userId =>
    triggerNotification({
      userId,
      type: 'system',
      title,
      message,
      priority,
      relatedEntityType: 'system',
    })
  );

  return Promise.all(promises);
}

/**
 * Trigger a marketing notification
 */
export async function triggerMarketingNotification(
  userIds: number[],
  title: string,
  message: string,
  priority: NotificationPriority = 'low'
) {
  const promises = userIds.map(userId =>
    triggerNotification({
      userId,
      type: 'marketing',
      title,
      message,
      priority,
      relatedEntityType: 'marketing',
    })
  );

  return Promise.all(promises);
}
