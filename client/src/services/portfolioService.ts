import { apiRequest } from '@/lib/queryClient';

// Define types for portfolio data
export type PortfolioData = {
  totalValue: number;
  cashBalance: number;
  investedAmount: number;
  totalProfit: number;
  profitPercentage: number;
  allocation: {
    stocks: number;
    bonds: number;
    etfs: number;
    crypto: number;
    cash: number;
  };
  performanceData: {
    date: string;
    value: number;
  }[];
};

/**
 * Get user portfolio data
 */
export async function getUserPortfolio(userId?: number | string): Promise<PortfolioData> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // Make a real API call to fetch portfolio data
    const response = await apiRequest('GET', `/portfolio/${userId}`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching portfolio data:', error);
    throw new Error(error.message || 'Failed to fetch portfolio data. Please try again later.');
  }
}

/**
 * Get recent transactions for the portfolio
 */
export async function getPortfolioTransactions(userId?: number | string): Promise<any[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // Make a real API call
    const response = await apiRequest('GET', `/portfolio/${userId}/transactions`);
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching portfolio transactions:', error);
    throw new Error(error.message || 'Failed to fetch portfolio transactions. Please try again later.');
  }
}

/**
 * Get market data for watchlist
 */
export async function getMarketData(): Promise<any[]> {
  try {
    // Make a real API call to a market data provider
    const response = await apiRequest('GET', '/market/data');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching market data:', error);
    throw new Error(error.message || 'Failed to fetch market data. Please try again later.');
  }
}

/**
 * Deposit funds to user account
 */
export async function depositFunds(userId: number | string, amount: number): Promise<{ success: boolean; amount: number }> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  try {
    const response = await apiRequest('POST', `/portfolio/${userId}/deposit`, { amount });
    return await response.json();
  } catch (error: any) {
    console.error('Error depositing funds:', error);
    throw new Error(error.message || 'Failed to deposit funds. Please try again later.');
  }
}

/**
 * Withdraw funds from user account
 */
export async function withdrawFunds(userId: number | string, amount: number): Promise<{ success: boolean; amount: number }> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  try {
    const response = await apiRequest('POST', `/portfolio/${userId}/withdraw`, { amount });
    return await response.json();
  } catch (error: any) {
    console.error('Error withdrawing funds:', error);
    throw new Error(error.message || 'Failed to withdraw funds. Please try again later.');
  }
}

/**
 * Make an investment in a security
 */
export async function investInSecurity(userId: number | string, symbol: string, amount: number): Promise<{ success: boolean; symbol: string; amount: number }> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!symbol) {
    throw new Error('Symbol is required');
  }
  
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  try {
    const response = await apiRequest('POST', `/portfolio/${userId}/invest`, { symbol, amount });
    return await response.json();
  } catch (error: any) {
    console.error('Error making investment:', error);
    throw new Error(error.message || 'Failed to make investment. Please try again later.');
  }
}

export default {
  getUserPortfolio,
  getPortfolioTransactions,
  getMarketData,
  depositFunds,
  withdrawFunds,
  investInSecurity
};
