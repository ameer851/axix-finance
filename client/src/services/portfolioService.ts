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
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/portfolio/${userId}`);
    // return await response.json();
    
    // For development, return dynamic data based on the user ID
    // This simulates different data for different users
    const seed = parseInt(userId.toString().slice(-2)) || 1;
    const randomFactor = seed / 100 + 0.8;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate dynamic data based on user ID
        const baseValue = 10000 * randomFactor;
        const investedAmount = baseValue * 0.8;
        const profit = baseValue * 0.2;
        const profitPercentage = (profit / investedAmount) * 100;
        
        // Generate performance data with some randomness
        const performanceData = [];
        const today = new Date();
        for (let i = 30; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Create some realistic market fluctuations
          const dayFactor = 1 + (Math.sin(i * seed) * 0.03);
          const value = Math.round((baseValue * 0.7) + (baseValue * 0.3 * (30 - i) / 30) * dayFactor);
          
          performanceData.push({
            date: date.toISOString().split('T')[0],
            value
          });
        }
        
        // Dynamically allocate assets based on user ID
        const stockAllocation = 35 + (seed % 20);
        const bondAllocation = 15 + (seed % 15);
        const etfAllocation = 10 + (seed % 15);
        const cryptoAllocation = 5 + (seed % 15);
        const cashAllocation = 100 - stockAllocation - bondAllocation - etfAllocation - cryptoAllocation;
        
        resolve({
          totalValue: Math.round(baseValue),
          cashBalance: Math.round(baseValue * (cashAllocation / 100)),
          investedAmount: Math.round(investedAmount),
          totalProfit: Math.round(profit),
          profitPercentage: Math.round(profitPercentage * 10) / 10,
          allocation: {
            stocks: stockAllocation,
            bonds: bondAllocation,
            etfs: etfAllocation,
            crypto: cryptoAllocation,
            cash: cashAllocation
          },
          performanceData
        });
      }, 300);
    });
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
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/portfolio/${userId}/transactions`);
    // return await response.json();
    
    // For development, return dynamic data
    const seed = parseInt(userId.toString().slice(-2)) || 1;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const transactions = [];
        const today = new Date();
        const transactionTypes = ['buy', 'sell', 'deposit', 'withdraw', 'dividend'];
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BTC', 'ETH'];
        
        for (let i = 0; i < 10; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - (i * 2));
          
          const typeIndex = (seed + i) % transactionTypes.length;
          const type = transactionTypes[typeIndex];
          
          const symbolIndex = (seed + i) % symbols.length;
          const symbol = symbols[symbolIndex];
          
          const amount = Math.round((100 + (seed * 10) + (i * 50)) * (Math.random() + 0.5));
          
          transactions.push({
            id: `tx-${seed}-${i}`,
            date: date.toISOString(),
            type,
            symbol: type === 'deposit' || type === 'withdraw' ? null : symbol,
            amount,
            status: 'completed'
          });
        }
        
        resolve(transactions);
      }, 300);
    });
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
    // In a real app, this would make an API call to a market data provider
    // const response = await apiRequest('GET', '/api/market/data');
    // return await response.json();
    
    // For development, return dynamic data
    return new Promise((resolve) => {
      setTimeout(() => {
        const stocks = [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 175.25 + (Math.random() * 10 - 5), change: 2.3 + (Math.random() * 2 - 1) },
          { symbol: 'MSFT', name: 'Microsoft Corp.', price: 340.75 + (Math.random() * 10 - 5), change: 1.5 + (Math.random() * 2 - 1) },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.20 + (Math.random() * 10 - 5), change: -0.8 + (Math.random() * 2 - 1) },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.35 + (Math.random() * 10 - 5), change: 3.2 + (Math.random() * 2 - 1) },
          { symbol: 'TSLA', name: 'Tesla Inc.', price: 215.50 + (Math.random() * 10 - 5), change: -1.7 + (Math.random() * 2 - 1) },
          { symbol: 'BTC', name: 'Bitcoin', price: 43250.00 + (Math.random() * 1000 - 500), change: 4.2 + (Math.random() * 2 - 1) },
          { symbol: 'ETH', name: 'Ethereum', price: 2150.75 + (Math.random() * 100 - 50), change: 2.8 + (Math.random() * 2 - 1) }
        ];
        
        // Round prices and changes to 2 decimal places
        stocks.forEach(stock => {
          stock.price = Math.round(stock.price * 100) / 100;
          stock.change = Math.round(stock.change * 100) / 100;
        });
        
        resolve(stocks);
      }, 300);
    });
  } catch (error: any) {
    console.error('Error fetching market data:', error);
    throw new Error(error.message || 'Failed to fetch market data. Please try again later.');
  }
}

export default {
  getUserPortfolio,
  getPortfolioTransactions,
  getMarketData
};
