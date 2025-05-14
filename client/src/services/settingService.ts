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
    
    throw new Error(error.message || `Failed to fetch setting "${name}". Please try again later.`);
  }
}

/**
 * Create a new setting (admin only)
 */
export async function createSetting(settingData: InsertSetting): Promise<Setting> {
  try {
    const response = await apiRequest('POST', '/api/settings', settingData);
    return await response.json();
  } catch (error: any) {
    console.error('Error creating setting:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to create system settings.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid setting data. Please check your inputs.');
    } else if (error.status === 409) {
      throw new Error(`Setting "${settingData.name}" already exists.`);
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to create setting. Please try again later.');
  }
}

/**
 * Update an existing setting (admin only)
 */
export async function updateSetting(
  name: string, 
  settingData: { value: string; description?: string }
): Promise<Setting> {
  try {
    const response = await apiRequest('PATCH', `/api/settings/${name}`, settingData);
    return await response.json();
  } catch (error: any) {
    console.error(`Error updating setting ${name}:`, error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to update system settings.');
    } else if (error.status === 404) {
      throw new Error(`Setting "${name}" not found.`);
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid setting data. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || `Failed to update setting "${name}". Please try again later.`);
  }
}

/**
 * Delete a setting (admin only)
 */
export async function deleteSetting(name: string): Promise<boolean> {
  try {
    const response = await apiRequest('DELETE', `/api/settings/${name}`);
    return true;
  } catch (error: any) {
    console.error(`Error deleting setting ${name}:`, error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to delete system settings.');
    } else if (error.status === 404) {
      throw new Error(`Setting "${name}" not found.`);
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || `Failed to delete setting "${name}". Please try again later.`);
  }
}

/**
 * Create or update bulk settings (admin only)
 */
export async function bulkUpdateSettings(
  settings: { name: string; value: string; description?: string }[]
): Promise<Setting[]> {
  try {
    const response = await apiRequest('POST', '/api/settings/bulk', { settings });
    return await response.json();
  } catch (error: any) {
    console.error('Error bulk updating settings:', error);
    
    if (error.status === 403) {
      throw new Error('You do not have permission to update system settings.');
    } else if (error.status === 400) {
      throw new Error(error.message || 'Invalid setting data. Please check your inputs.');
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message || 'Failed to update settings. Please try again later.');
  }
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
