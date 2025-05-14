import { Log, InsertLog, LogType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export type LogFilters = {
  type?: LogType;
  userId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
};

/**
 * Get all logs with optional filtering and pagination (admin only)
 */
export async function getLogs(filters: LogFilters = {}): Promise<{
  logs: Log[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.userId) queryParams.append('userId', String(filters.userId));
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.page) queryParams.append('page', String(filters.page));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.order) queryParams.append('order', filters.order);
    
    const url = `/api/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest('GET', url);
    
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view system logs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch system logs. Please try again later.');
  }
}

/**
 * Get a single log by ID (admin only)
 */
export async function getLog(logId: number): Promise<Log> {
  try {
    const response = await apiRequest('GET', `/api/logs/${logId}`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching log:', error);
    
    if (error.status === 404) {
      throw new Error('Log entry not found.');
    } else if (error.status === 403) {
      throw new Error('You do not have permission to view this log entry.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch log details. Please try again later.');
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: number, filters: Omit<LogFilters, 'userId'> = {}): Promise<{
  logs: Log[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return getLogs({ ...filters, userId, type: 'audit' });
}

/**
 * Create a client-side log entry (errors, warnings)
 * This is only for critical client-side errors that should be logged on the server
 */
export async function createClientLog(logData: Omit<InsertLog, 'ipAddress'>): Promise<Log | null> {
  try {
    const response = await apiRequest('POST', '/api/logs/client', logData);
    return await response.json();
  } catch (error: any) {
    // We don't throw here because this is typically called from error handlers
    // and we don't want to create infinite loops
    console.error('Failed to create client-side log entry:', error);
    return null;
  }
}

/**
 * Export logs as CSV (admin only)
 */
export async function exportLogsAsCsv(filters: LogFilters = {}): Promise<Blob> {
  try {
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.userId) queryParams.append('userId', String(filters.userId));
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.search) queryParams.append('search', filters.search);
    
    const url = `/api/logs/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest('GET', url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to export logs');
    }
    
    return await response.blob();
  } catch (error: any) {
    console.error('Error exporting logs:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to export system logs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to export logs. Please try again later.');
  }
}

/**
 * Get log type label for UI display
 */
export function getLogTypeLabel(type: LogType): string {
  const labels: Record<LogType, string> = {
    info: 'Information',
    warning: 'Warning',
    error: 'Error',
    audit: 'Audit'
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get log type color for UI display
 */
export function getLogTypeColor(type: LogType): string {
  const colors: Record<LogType, string> = {
    info: 'blue',
    warning: 'amber',
    error: 'red',
    audit: 'green'
  };
  return colors[type] || 'gray';
}
