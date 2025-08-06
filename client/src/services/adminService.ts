
import { api } from '@/lib/api';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingTransactions: number;
  maintenanceMode: boolean;
}

export interface AdminDeposit {
  id: string;
  userId: string;
  amount: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reference?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
}

export interface AdminWithdrawal {
  id: string;
  userId: string;
  amount: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  address?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
}

// Admin Stats Service
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    console.log('Fetching admin stats...');
    const response = await api.get<AdminStats>('/api/admin/dashboard');
    console.log('Admin stats response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    // Return default stats on error to prevent crashes
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      pendingTransactions: 0,
      maintenanceMode: false,
    };
  }
};

// Admin Deposits Service
export const getAdminDeposits = async (params?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}): Promise<AdminDeposit[]> => {
  try {
    console.log('Fetching admin deposits with params:', params);
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.amountMin) queryParams.append('amountMin', params.amountMin.toString());
    if (params?.amountMax) queryParams.append('amountMax', params.amountMax.toString());
    
    const url = `/api/admin/deposits${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<AdminDeposit[]>(url);
    console.log('Admin deposits response:', response);
    return response || [];
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return [];
  }
};

// Admin Withdrawals Service
export const getAdminWithdrawals = async (params?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}): Promise<AdminWithdrawal[]> => {
  try {
    console.log('Fetching admin withdrawals with params:', params);
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.amountMin) queryParams.append('amountMin', params.amountMin.toString());
    if (params?.amountMax) queryParams.append('amountMax', params.amountMax.toString());
    
    const url = `/api/admin/withdrawals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<AdminWithdrawal[]>(url);
    console.log('Admin withdrawals response:', response);
    return response || [];
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return [];
  }
};

// Approve Deposit
export const approveDeposit = async (depositId: string): Promise<void> => {
  try {
    await api.post(`/api/admin/deposits/${depositId}/approve`, {});
  } catch (error) {
    console.error('Error approving deposit:', error);
    throw error;
  }
};

// Approve Withdrawal
export const approveWithdrawal = async (withdrawalId: string): Promise<void> => {
  try {
    await api.post(`/api/admin/withdrawals/${withdrawalId}/approve`, {});
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    throw error;
  }
};

// Admin service with proper React Query integration
export const adminService = {
  getStats: getAdminStats,
  getDeposits: getAdminDeposits,
  getWithdrawals: getAdminWithdrawals,
  approveDeposit,
  approveWithdrawal,
};

export default adminService;
