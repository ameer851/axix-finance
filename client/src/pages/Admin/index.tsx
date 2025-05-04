import React from 'react';
import { useQuery } from '@tanstack/react-query';
import StatCard from '@/components/ui/stat-card';
import ChartCard from '@/components/ui/chart-card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Link } from 'wouter';
import { formatCurrency, formatDate, getTransactionTypeColor, getStatusColor } from '@/lib/utils';
import { Transaction, User } from '@shared/schema';
import { 
  Users,
  UserCheck,
  ClockIcon,
  BarChartIcon,
  ArrowRight,
  Check,
  X,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  PieChart
} from 'lucide-react';
import { getAdminDashboardStats, getPendingTransactions, approveTransaction, rejectTransaction, getUserById } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: getAdminDashboardStats
  });

  // Fetch pending transactions
  const { data: pendingTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions/pending'],
    queryFn: getPendingTransactions
  });

  // Approve transaction mutation
  const approveMutation = useMutation({
    mutationFn: approveTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Transaction approved",
        description: "The transaction has been successfully approved."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reject transaction mutation
  const rejectMutation = useMutation({
    mutationFn: rejectTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Transaction rejected",
        description: "The transaction has been rejected."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Approve transaction handler
  const handleApprove = (transactionId: number) => {
    approveMutation.mutate(transactionId);
  };

  // Reject transaction handler
  const handleReject = (transactionId: number) => {
    rejectMutation.mutate(transactionId);
  };

  // Fetch system analytics data
  const { data: analyticsData = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) {
          return [];
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        return [];
      }
    }
  });

  // Chart settings
  const chartButtonOptions = [
    { label: 'Users', value: 'users', selected: false },
    { label: 'Transactions', value: 'transactions', selected: true },
    { label: 'Revenue', value: 'revenue', selected: false },
  ];

  // Table columns for pending transactions
  const pendingTransactionsColumns = [
    {
      header: 'User',
      accessorKey: 'userId',
      cell: async (transaction: Transaction) => {
        try {
          // In a real implementation, you would use a query hook to fetch this data
          // or ensure it's included in the transaction data from the API
          const user = await getUserById(transaction.userId);
          return (
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  {`${user.firstName[0]}${user.lastName[0]}`}
                </span>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {`${user.firstName} ${user.lastName}`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ID: #{user.id}
                </div>
              </div>
            </div>
          );
        } catch (error) {
          return (
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 font-medium">?</span>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  User #{transaction.userId}
                </div>
              </div>
            </div>
          );
        }
      }
    },
    {
      header: 'Transaction Type',
      accessorKey: 'type',
      cell: (transaction: Transaction) => {
        const getTransactionIcon = (type: string) => {
          switch (type) {
            case 'deposit':
              return <ArrowDown className="h-5 w-5" />;
            case 'withdrawal':
              return <ArrowUp className="h-5 w-5" />;
            case 'transfer':
              return <ArrowLeftRight className="h-5 w-5" />;
            case 'investment':
              return <PieChart className="h-5 w-5" />;
            default:
              return <ArrowLeftRight className="h-5 w-5" />;
          }
        };

        return (
          <div>
            <div className="text-sm text-gray-900 dark:text-white flex items-center">
              {getTransactionIcon(transaction.type)}
              <span className="ml-1">{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{transaction.description || `${transaction.type} transaction`}</div>
          </div>
        );
      }
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (transaction: Transaction) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatCurrency(transaction.amount as string)}
        </div>
      )
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (transaction: Transaction) => {
        const date = new Date(transaction.createdAt);
        return (
          <div>
            <div className="text-sm text-gray-900 dark:text-white">{formatDate(date)}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{date.toLocaleTimeString()}</div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (transaction: Transaction) => {
        const { bgClass, textClass } = getStatusColor(transaction.status);
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgClass} ${textClass}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        );
      }
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
      
      {/* Platform Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Users"
          value={statsLoading ? "Loading..." : dashboardStats?.totalUsers.toString() || "0"}
          icon={<Users className="h-6 w-6 text-white" />}
          iconBgColor="bg-primary-500"
          footer={
            <div className="text-sm">
              <Link href="/admin/users">
                <a className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  View all users
                </a>
              </Link>
            </div>
          }
        />
        
        <StatCard
          title="Active Accounts"
          value={statsLoading ? "Loading..." : dashboardStats?.activeUsers.toString() || "0"}
          icon={<UserCheck className="h-6 w-6 text-white" />}
          iconBgColor="bg-green-500"
          footer={
            <div className="text-sm">
              <Link href="/admin/users">
                <a className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  View analytics
                </a>
              </Link>
            </div>
          }
        />
        
        <StatCard
          title="Pending Approvals"
          value={statsLoading ? "Loading..." : dashboardStats?.pendingTransactions.toString() || "0"}
          icon={<ClockIcon className="h-6 w-6 text-white" />}
          iconBgColor="bg-yellow-500"
          footer={
            <div className="text-sm">
              <Link href="/admin/transactions">
                <a className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  Review transactions
                </a>
              </Link>
            </div>
          }
        />
        
        <StatCard
          title="Transaction Volume"
          value={statsLoading ? "Loading..." : formatCurrency(dashboardStats?.transactionVolume || "0")}
          icon={<BarChartIcon className="h-6 w-6 text-white" />}
          iconBgColor="bg-indigo-500"
          footer={
            <div className="text-sm">
              <Link href="/admin/analytics">
                <a className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  View reports
                </a>
              </Link>
            </div>
          }
        />
      </div>

      {/* Analytics Graph */}
      <ChartCard
        title="System Analytics"
        description="Platform performance and usage metrics"
        className="mb-6"
        actions={
          <div className="flex space-x-3">
            {chartButtonOptions.map((option) => (
              <Button
                key={option.value}
                variant={option.selected ? "secondary" : "outline"}
                size="sm"
              >
                {option.label}
              </Button>
            ))}
          </div>
        }
      >
        <div className="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analyticsData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="transactions" fill="#3B82F6" name="Transactions" />
              <Bar dataKey="users" fill="#10B981" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Pending Approval Transactions */}
      <div className="bg-white dark:bg-neutral-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Pending Approvals
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
              Transactions awaiting admin review
            </p>
          </div>
          <div>
            {!transactionsLoading && pendingTransactions && pendingTransactions.length > 0 && (
              <Button 
                onClick={() => {
                  toast({
                    title: "Bulk approval not implemented",
                    description: "This feature is not implemented in the demo."
                  });
                }}
              >
                Approve All
              </Button>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <DataTable
            columns={pendingTransactionsColumns}
            data={pendingTransactions || []}
            loading={transactionsLoading}
            actions={(transaction) => (
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900"
                  onClick={() => handleApprove(transaction.id)}
                  disabled={approveMutation.isPending}
                >
                  <Check className="mr-1 h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                  onClick={() => handleReject(transaction.id)}
                  disabled={rejectMutation.isPending}
                >
                  <X className="mr-1 h-4 w-4" /> Reject
                </Button>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
