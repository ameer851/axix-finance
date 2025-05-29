// Since admin functionality has been removed, notification creation is disabled
// This file provides stub implementations to maintain compatibility

interface TriggerNotificationOptions {
  userId: number;
  type: string;
  title?: string;
  message: string;
  priority?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

/**
 * Trigger a notification for a user (disabled - admin functionality removed)
 */
export async function triggerNotification(options: TriggerNotificationOptions) {
  // Admin functionality removed - notifications are no longer created in the database
  console.log('Notification would be triggered:', options);
  return true;
}

/**
 * Trigger a transaction-related notification (disabled - admin functionality removed)
 */
export async function triggerTransactionNotification(
  userId: number,
  transactionId: number,
  status: 'pending' | 'completed' | 'rejected',
  amount: string,
  type: 'deposit' | 'withdrawal' | 'transfer' | 'investment'
) {
  // Admin functionality removed - notifications are no longer created in the database
  console.log('Transaction notification would be triggered:', {
    userId,
    transactionId,
    status,
    amount,
    type
  });
  return true;
}

/**
 * Trigger a security notification (disabled - admin functionality removed)
 */
export async function triggerSecurityNotification(
  userId: number,
  type: string,
  message: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
) {
  // Admin functionality removed - notifications are no longer created in the database
  console.log('Security notification would be triggered:', { userId, type, message, priority });
  return true;
}

/**
 * Trigger a system-wide announcement notification (disabled - admin functionality removed)
 */
export async function triggerSystemNotification(
  userIds: number[],
  title: string,
  message: string,
  type: string = 'announcement'
) {
  // Admin functionality removed - notifications are no longer created in the database
  console.log('System notification would be triggered:', {
    userIds,
    title,
    message,
    type
  });
  return true;
}

/**
 * Trigger an account-related notification (disabled - admin functionality removed)
 */
export async function triggerAccountNotification(
  userId: number,
  accountEvent: string,
  details: any,
  title = 'Account updated'
) {
  // Admin functionality removed - notifications are no longer created in the database
  console.log('Account notification would be triggered:', {
    userId,
    accountEvent,
    details,
    title
  });
  return true;
}
