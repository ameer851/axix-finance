import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowUp, ArrowDown, Users, CreditCard, Clock, Calendar, AlertCircle } from 'lucide-react';
import { getAdminDashboardStats } from '@/services/adminService';
import { formatCurrency } from '@/lib/utils';
import TransactionsManager from './TransactionsManager';
import UserManagement from './UserManagement';
import MaintenanceMode from './MaintenanceMode';
import AdminLogs from './AdminLogs';

/**
 * Admin Dashboard component
 * Central hub that provides access to all admin features:
 * - Overview statistics
 * - Transaction approval/rejection
 * - User management
 * - System maintenance
 * - Admin logs
 */
const AdminDashboard: React.FC = () => {
  // Fetch admin dashboard statistics
  const { 
    data: stats, 
    isLoading: isStatsLoading,
    isError: isStatsError
  } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    staleTime: 30000, // 30 seconds
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Manage all aspects of the CaraxFinance platform</p>
      </div>

      {/* Dashboard summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : isStatsError ? (
              <div className="text-sm text-red-500">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeUsers.toLocaleString()} active ({Math.round((stats?.activeUsers / stats?.totalUsers) * 100) || 0}%)
                </p>
                {stats?.newUsersToday > 0 && (
                  <div className="mt-1 flex items-center text-xs text-green-600">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    <span>+{stats.newUsersToday} today</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Transactions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : isStatsError ? (
              <div className="text-sm text-red-500">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.pendingTransactions.toLocaleString()}</div>
                <div className="flex space-x-2 text-xs text-muted-foreground">
                  <span className="text-amber-600">
                    {stats?.depositsPending} deposits
                  </span>
                  <span>•</span>
                  <span className="text-blue-600">
                    {stats?.withdrawalsPending} withdrawals
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transaction Volume Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : isStatsError ? (
              <div className="text-sm text-red-500">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(Number(stats?.transactionVolume || 0), 'USD')}</div>
                <p className="text-xs text-muted-foreground">
                  Total transaction volume
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {isStatsLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : (
              stats?.systemHealth.status === 'healthy' ? (
                <div className="h-4 w-4 rounded-full bg-green-500" />
              ) : stats?.systemHealth.status === 'warning' ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )
            )}
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : isStatsError ? (
              <div className="text-sm text-red-500">Error loading data</div>
            ) : (
              <>
                <div className="flex items-center">
                  <div 
                    className={`text-sm font-medium capitalize ${
                      stats?.systemHealth.status === 'healthy' 
                        ? 'text-green-600' 
                        : stats?.systemHealth.status === 'warning'
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}
                  >
                    {stats?.systemHealth.status}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.systemHealth.message || 'All systems operational'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main admin panel features */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="logs">Admin Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-6">
          <TransactionsManager />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-6">
          <MaintenanceMode />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          <AdminLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
