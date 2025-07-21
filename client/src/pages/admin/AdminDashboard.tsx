import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingTransactions: number;
  maintenanceMode: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransactions: 0,
    maintenanceMode: false
  });

  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {    // Fetch real admin stats from API
    const fetchStats = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Deposits</h3>
          <p className="text-3xl font-bold text-emerald-600">${stats.totalDeposits.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Withdrawals</h3>
          <p className="text-3xl font-bold text-orange-600">${stats.totalWithdrawals.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Transactions</h3>
          <p className="text-3xl font-bold text-amber-600">{stats.pendingTransactions}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">System Status</h3>
          <p className={`text-3xl font-bold ${stats.maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
            {stats.maintenanceMode ? 'Maintenance' : 'Operational'}
          </p>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Admin Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">New user registration</span>
              <span className="text-xs text-gray-500">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Deposit processed</span>
              <span className="text-xs text-gray-500">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Withdrawal approved</span>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Process Pending Transactions
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              Generate Reports
            </button>
            <button className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
              System Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
