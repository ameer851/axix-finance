import { apiRequest } from '@/lib/queryClient';

/**
 * Get user's watchlist
 */
export async function getWatchlist(userId: number | string): Promise<string[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const response = await apiRequest('GET', `/users/${userId}/watchlist`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    
    if (error.isOffline || error.isNetworkError) {
      // Return empty watchlist for offline mode
      return [];
    }
    
    throw new Error(error.message || 'Failed to fetch watchlist. Please try again later.');
  }
}

/**
 * Add a symbol to watchlist
 */
export async function addToWatchlist(userId: number | string, symbol: string): Promise<{ success: boolean }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }
    
    const response = await apiRequest('POST', `/users/${userId}/watchlist`, {
      symbol
    });
    return await response.json();
  } catch (error: any) {
    console.error('Error adding to watchlist:', error);
    
    if (error.isOffline || error.isNetworkError) {
      throw new Error('You are currently offline. Please try again when you have an internet connection.');
    }
    
    throw new Error(error.message || 'Failed to add to watchlist. Please try again later.');
  }
}

/**
 * Remove a symbol from watchlist
 */
export async function removeFromWatchlist(userId: number | string, symbol: string): Promise<{ success: boolean }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }
    
    const response = await apiRequest('DELETE', `/users/${userId}/watchlist/${symbol}`);
    return await response.json();
  } catch (error: any) {
    console.error('Error removing from watchlist:', error);
    
    if (error.isOffline || error.isNetworkError) {
      throw new Error('You are currently offline. Please try again when you have an internet connection.');
    }
    
    throw new Error(error.message || 'Failed to remove from watchlist. Please try again later.');
  }
}

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};
