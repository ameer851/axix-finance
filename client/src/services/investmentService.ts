import { apiRequest } from '@/lib/queryClient';
import { getCryptoExchangeRates as getTradingViewRates } from './tradingViewService';

// Bank transfer details
export const BANK_TRANSFER_DETAILS = {
  bankName: 'Axix International Bank',
  accountName: 'Axix Finance Ltd',
  accountNumber: '8742109365',
  routingNumber: '072305679',
  swiftCode: 'CRAXINTL',
  iban: 'GB29NWBK60161331926819',
  bankAddress: '25 Financial Avenue, London, EC2R 8AQ, United Kingdom'
};

// Define types for investment plans
export type InvestmentPlan = {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  returnRate: string;
  duration: string;
  features: string[];
  walletAddresses: {
    bitcoin: string;
    bitcoinCash: string;
    ethereum: string;
    bnb: string;
    usdt: string;
  };
};

// Wallet addresses for all plans
const WALLET_ADDRESSES = {
  bitcoin: 'bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58',
  bitcoinCash: 'qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g',
  ethereum: '0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32',
  bnb: '0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32', // Same address as Ethereum
  usdt: 'THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb'
};

// Investment plans with real wallet addresses
const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    minAmount: 100,
    maxAmount: 1000,
    returnRate: '5-8% Monthly',
    duration: '3 Months',
    features: [
      'Basic portfolio management',
      'Weekly market updates',
      'Email support'
    ],
    walletAddresses: {
      bitcoin: WALLET_ADDRESSES.bitcoin,
      bitcoinCash: WALLET_ADDRESSES.bitcoinCash,
      ethereum: WALLET_ADDRESSES.ethereum,
      bnb: WALLET_ADDRESSES.bnb,
      usdt: WALLET_ADDRESSES.usdt
    }
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    minAmount: 1000,
    maxAmount: 10000,
    returnRate: '8-12% Monthly',
    duration: '6 Months',
    features: [
      'Advanced portfolio management',
      'Daily market updates',
      'Priority email & chat support',
      'Quarterly strategy sessions'
    ],
    walletAddresses: {
      bitcoin: WALLET_ADDRESSES.bitcoin,
      bitcoinCash: WALLET_ADDRESSES.bitcoinCash,
      ethereum: WALLET_ADDRESSES.ethereum,
      bnb: WALLET_ADDRESSES.bnb,
      usdt: WALLET_ADDRESSES.usdt
    }
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    minAmount: 10000,
    maxAmount: 100000,
    returnRate: '12-18% Monthly',
    duration: '12 Months',
    features: [
      'Personalized portfolio management',
      'Real-time market alerts',
      '24/7 dedicated support',
      'Monthly strategy sessions',
      'Tax optimization',
      'Early access to new investment opportunities'
    ],
    walletAddresses: {
      bitcoin: WALLET_ADDRESSES.bitcoin,
      bitcoinCash: WALLET_ADDRESSES.bitcoinCash,
      ethereum: WALLET_ADDRESSES.ethereum,
      bnb: WALLET_ADDRESSES.bnb,
      usdt: WALLET_ADDRESSES.usdt
    }
  }
];

/**
 * Get all available investment plans
 */
export async function getInvestmentPlans(): Promise<InvestmentPlan[]> {
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', '/api/investment-plans');
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(INVESTMENT_PLANS);
      }, 300);
    });
  } catch (error: any) {
    console.error('Error fetching investment plans:', error);
    throw new Error(error.message || 'Failed to fetch investment plans. Please try again later.');
  }
}

/**
 * Get a specific investment plan by ID
 */
export async function getInvestmentPlan(planId: string): Promise<InvestmentPlan | undefined> {
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/investment-plans/${planId}`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const plan = INVESTMENT_PLANS.find(p => p.id === planId);
        resolve(plan);
      }, 300);
    });
  } catch (error: any) {
    console.error('Error fetching investment plan:', error);
    throw new Error(error.message || 'Failed to fetch investment plan. Please try again later.');
  }
}

/**
 * Get current cryptocurrency exchange rates
 * Now fetches real-time data from TradingView API with fallback
 */
export async function getCryptoExchangeRates(): Promise<{
  bitcoin: number;
  bitcoinCash: number;
  ethereum: number;
  bnb: number;
  usdt: number;
}> {
  try {
    // Fetch real-time rates from TradingView
    const tradingViewRates = await getTradingViewRates();
    
    return {
      bitcoin: tradingViewRates.bitcoin || 98750.00,
      bitcoinCash: tradingViewRates.bitcoinCash || 485.20,
      ethereum: tradingViewRates.ethereum || 3420.85,
      bnb: tradingViewRates.bnb || 672.40,
      usdt: tradingViewRates.usdt || 1.00
    };
  } catch (error: any) {
    console.error('Error fetching real-time crypto rates, using fallback:', error);
    
    // Fallback to static prices if TradingView API fails
    return {
      bitcoin: 98750.00,      // Bitcoin (BTC) - Fallback price
      bitcoinCash: 485.20,    // Bitcoin Cash (BCH) - Fallback price
      ethereum: 3420.85,     // Ethereum (ETH) - Fallback price
      bnb: 672.40,           // BNB (BSC) - Fallback price
      usdt: 1.00             // USDT (TRC20) - Stable at $1.00
    };
  }
}

/**
 * Subscribe to an investment plan
 */
export async function subscribeToInvestmentPlan(data: {
  userId?: number | string;
  planId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}): Promise<{
  success: boolean;
  subscriptionId: string;
  message: string;
}> {
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('POST', '/api/subscriptions', data);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          subscriptionId: `sub_${Math.random().toString(36).substring(2, 15)}`,
          message: 'Successfully subscribed to investment plan'
        });
      }, 500);
    });
  } catch (error: any) {
    console.error('Error subscribing to investment plan:', error);
    throw new Error(error.message || 'Failed to subscribe to investment plan. Please try again later.');
  }
}

/**
 * Get user's active investment plans
 */
export async function getUserInvestments(userId?: number | string): Promise<any[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // In a real app, this would make an API call
    // const response = await apiRequest('GET', `/api/users/${userId}/investments`);
    // return await response.json();
    
    // For development, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'inv_123456',
            planId: 'starter',
            planName: 'Starter Plan',
            amount: 500,
            returnRate: '6.5%',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            currentValue: 525,
            profit: 25
          }
        ]);
      }, 500);
    });
  } catch (error: any) {
    console.error('Error fetching user investments:', error);
    throw new Error(error.message || 'Failed to fetch user investments. Please try again later.');
  }
}

export default {
  getInvestmentPlans,
  getInvestmentPlan,
  getCryptoExchangeRates,
  subscribeToInvestmentPlan,
  getUserInvestments
};
