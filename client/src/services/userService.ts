import { User, Transaction } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export async function getUser(userId: number): Promise<User> {
  try {
    const response = await apiRequest('GET', `/api/users/${userId}`);
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user information');
  }
}

export async function getUserTransactions(userId: number): Promise<Transaction[]> {
  try {
    const response = await apiRequest('GET', `/api/users/${userId}/transactions`);
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user transactions');
  }
}

export async function updateUserProfile(userId: number, profileData: Partial<User>): Promise<User> {
  try {
    const response = await apiRequest('PATCH', `/api/users/${userId}`, profileData);
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user profile');
  }
}

export async function getDashboardStats(userId: number): Promise<{
  balance: string;
  pendingTransactions: number;
  monthlyProfit: string;
}> {
  try {
    // In a real-world application, this would be an API endpoint
    // For now, we'll use the existing transactions and user data
    const user = await getUser(userId);
    const transactions = await getUserTransactions(userId);
    
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    
    // Calculate monthly profit (this is simplified; in a real app you'd have a more complex calculation)
    // For this demo, we'll use a random positive value as monthly profit
    const monthlyProfit = (Math.random() * 2000).toFixed(2);
    
    return {
      balance: user.balance as string,
      pendingTransactions,
      monthlyProfit
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch dashboard statistics');
  }
}
