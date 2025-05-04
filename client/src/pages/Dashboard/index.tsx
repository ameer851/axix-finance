import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import AccountSummary from '@/components/ui/account-summary';
import ChartCard from '@/components/ui/chart-card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Transaction } from '@shared/schema';
import { Link } from 'wouter';
import InvestmentCalculator from '@/components/InvestmentCalculator';
import {
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  PieChart,
  ArrowRight,
  TrendingUp,
  Calculator
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { formatDate } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch user transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/users/${user?.id}/transactions`],
  });

  const portfolioButtonOptions = [
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m', selected: true },
    { label: '3M', value: '3m' },
    { label: '1Y', value: '1y' },
    { label: 'All', value: 'all' }
  ];

  // Portfolio performance data
  const { data: portfolioData = [], isLoading: portfolioLoading } = useQuery({
    queryKey: ['/api/user/portfolio-performance'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/portfolio-performance');
        if (!response.ok) {
          return [];
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch portfolio data:', error);
        return [];
      }
    }
  });

  // Table columns configuration
  const columns = [
    {
      header: 'Transaction',
      accessorKey: 'type' as keyof Transaction,
      cell: (transaction: Transaction) => (
        <div className="flex items-center">
          <div className={`
            flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full
            ${transaction.type === 'deposit' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' : 
              transaction.type === 'withdrawal' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' : 
              transaction.type === 'transfer' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300' :
              'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'}
          `}>
            {transaction.type === 'deposit' ? <ArrowDown className="h-5 w-5" /> :
             transaction.type === 'withdrawal' ? <ArrowUp className="h-5 w-5" /> :
             transaction.type === 'transfer' ? <ArrowLeftRight className="h-5 w-5" /> :
             <PieChart className="h-5 w-5" />}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {transaction.description || `${transaction.type} transaction`}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Date',
      accessorKey: 'createdAt' as keyof Transaction,
      cell: (transaction: Transaction) => {
        const date = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
        return (
          <div>
            <div className="text-sm text-gray-900 dark:text-white">
              {formatDate(date)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Amount',
      accessorKey: 'amount' as keyof Transaction,
      cell: (transaction: Transaction) => {
        const isNegative = transaction.type === 'withdrawal' || transaction.type === 'investment';
        const prefix = isNegative ? '-' : '+';
        const className = isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
        
        return (
          <div className={`text-sm font-medium ${className}`}>
            {transaction.type === 'transfer' ? '' : prefix}${transaction.amount}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status' as keyof Transaction,
      cell: (transaction: Transaction) => {
        let bgColor, textColor;
        
        switch(transaction.status) {
          case 'completed':
            bgColor = 'bg-green-100 dark:bg-green-900';
            textColor = 'text-green-800 dark:text-green-200';
            break;
          case 'pending':
            bgColor = 'bg-yellow-100 dark:bg-yellow-900';
            textColor = 'text-yellow-800 dark:text-yellow-200';
            break;
          case 'rejected':
            bgColor = 'bg-red-100 dark:bg-red-900';
            textColor = 'text-red-800 dark:text-red-200';
            break;
          default:
            bgColor = 'bg-gray-100 dark:bg-gray-800';
            textColor = 'text-gray-800 dark:text-gray-200';
        }
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        );
      }
    }
  ];

  const balance = user?.balance || "0";
  const pendingTransactions = transactions?.filter(t => t.status === 'pending')?.length || 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      {/* Account Overview */}
      <AccountSummary 
        balance={`$${parseFloat(balance).toLocaleString()}`}
        profit="+$1,482.30"
        pendingTransactions={pendingTransactions}
      />

      {/* Portfolio Performance */}
      <ChartCard
        title="Portfolio Performance"
        description="Last 30 days activity"
        className="mb-6"
        actions={
          <div className="flex space-x-3">
            {portfolioButtonOptions.map((option) => (
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
            <AreaChart
              data={portfolioData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      
      {/* Investment Calculator */}
      <div className="mb-6">
        <InvestmentCalculator />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-neutral-800 shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
              Your latest financial activity
            </p>
          </div>
          <Link href="/transactions">
            <Button className="inline-flex items-center">
              <span className="mr-2">New Transaction</span>
              <TrendingUp className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <DataTable
            columns={columns}
            data={transactions || []}
            loading={transactionsLoading}
            actions={(row) => (
              <Link href={`/transactions/${row.id}`}>
                <Button variant="link" className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                  View <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
