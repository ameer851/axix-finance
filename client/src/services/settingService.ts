import { Setting, InsertSetting } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

/**
 * Get all system settings
 */
export async function getAllSettings(): Promise<Setting[]> {
  try {
    const response = await apiRequest('GET', '/api/settings');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to view system settings.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to fetch system settings. Please try again later.');
  }
}

/**
 * Get a single setting by name
 */
export async function getSetting(name: string): Promise<Setting> {
  try {
    const response = await apiRequest('GET', `/api/settings/${name}`);
    return await response.json();
  } catch (error: any) {
    console.error(`Error fetching setting ${name}:`, error);
    
    if (error.status === 404) {
      throw new Error(`Setting "${name}" not found.`);
    } else if (error.status === 403) {
      throw new Error('You do not have permission to view this setting.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || `Failed to fetch setting "${name}". Please try again later.`);  }
}

/**
 * Get client-side visible settings
 * These are settings that should be visible to the client without authentication
 */
export async function getPublicSettings(): Promise<Record<string, string>> {
  try {
    const response = await apiRequest('GET', '/api/settings/public');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching public settings:', error);
    
    if (error.isOffline || error.isNetworkError) {
      console.warn('Cannot fetch public settings due to network issue');
      // Return empty object for offline mode
      return {};
    }
    
    // For other errors, return empty object as well
    console.error('Returning empty settings due to error:', error);
    return {};
  }
}
