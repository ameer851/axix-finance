import { apiRequest } from '@/lib/queryClient';

export interface MarketNews {
  id: string;
  title: string;
  source: string;
  date: string;
  url: string;
  summary?: string;
  category?: string;
  impact?: 'high' | 'medium' | 'low';
}

/**
 * Get market news from the API
 */
export async function getMarketNews(): Promise<MarketNews[]> {
  try {
    const response = await apiRequest('GET', '/market/news');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching market news:', error);
    
    if (error.isOffline || error.isNetworkError) {
      // Return empty news for offline mode
      return [];
    }
    
    throw new Error(error.message || 'Failed to fetch market news. Please try again later.');
  }
}

/**
 * Get market data including top movers, indexes, and trending stocks
 */
export async function getMarketGlobalData() {
  try {
    const response = await apiRequest('GET', '/market/global');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching global market data:', error);
    
    if (error.isOffline || error.isNetworkError) {
      // Return empty data for offline mode
      return { 
        indexes: [],
        topGainers: [],
        topLosers: [],
        trending: []
      };
    }
    
    throw new Error(error.message || 'Failed to fetch global market data. Please try again later.');
  }
}

/**
 * Search for stocks by symbol or name
 */
export async function searchMarketSymbols(query: string) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const response = await apiRequest('GET', `/market/search?q=${encodeURIComponent(query)}`);
    return await response.json();
  } catch (error: any) {
    console.error('Error searching market symbols:', error);
    
    if (error.isOffline || error.isNetworkError) {
      throw new Error('You are currently offline. Please try again when you have an internet connection.');
    }
    
    throw new Error(error.message || 'Failed to search market symbols. Please try again later.');
  }
}

export default {
  getMarketNews,
  getMarketGlobalData,
  searchMarketSymbols
};
