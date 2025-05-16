import { apiRequest } from '@/lib/queryClient';

/**
 * Interface for audit log entry
 */
export interface AuditLogEntry {
  id?: string;
  userId: number | string;
  action: string;
  category: 'transaction' | 'user' | 'system' | 'security' | 'other';
  targetId?: string | number;
  targetType?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event for tracking and compliance
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp' | 'ipAddress' | 'userAgent'>): Promise<void> {
  try {
    // Server will add timestamp, IP, and user agent information
    await apiRequest('POST', '/api/admin/audit-logs', entry);
  } catch (error: any) {
    // Don't block the UI for audit log failures, but log them
    console.error('Error logging audit event:', error);
    
    // For critical operations, you might want to show a warning to the admin
    if (entry.category === 'transaction' || entry.category === 'security') {
      // Optionally throw for critical audit failures
      throw new Error('Failed to record this action for compliance purposes. Please retry or contact support.');
    }
  }
}

/**
 * Get audit logs with pagination and filtering
 */
export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  userId?: string | number;
  category?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  data: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.userId) queryParams.append('userId', params.userId.toString());
  if (params.category) queryParams.append('category', params.category);
  if (params.action) queryParams.append('action', params.action);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const url = `/api/admin/audit-logs?${queryParams.toString()}`;
  
  try {
    const response = await apiRequest('GET', url);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    throw new Error('Failed to fetch audit logs. Please try again later.');
  }
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogs(params: {
  userId?: string | number;
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Blob> {
  const queryParams = new URLSearchParams();
  
  if (params.userId) queryParams.append('userId', params.userId.toString());
  if (params.category) queryParams.append('category', params.category);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const url = `/api/admin/audit-logs/export?${queryParams.toString()}`;
  
  try {
    const response = await apiRequest('GET', url, undefined, {
      headers: { 'Accept': 'text/csv' },
      returnRawResponse: true
    });
    
    return await response.blob();
  } catch (error: any) {
    console.error('Error exporting audit logs:', error);
    throw new Error('Failed to export audit logs. Please try again later.');
  }
}

export default {
  logAuditEvent,
  getAuditLogs,
  exportAuditLogs
};
