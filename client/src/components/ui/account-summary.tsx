import React from 'react';
import { Link } from 'wouter';
import StatCard from '@/components/ui/stat-card';
import { Wallet, TrendingUp, Clock } from 'lucide-react';

interface AccountSummaryProps {
  balance: string;
  profit: string;
  pendingTransactions: number;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({
  balance,
  profit,
  pendingTransactions
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <StatCard
        title="Total Balance"
        value={balance}
        icon={<Wallet className="h-6 w-6 text-white" />}
        iconBgColor="bg-primary-500"
        footer={
          <div className="text-sm">
            <Link href="/transactions">
              <a className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                View details
              </a>
            </Link>
          </div>
        }
      />
      
      <StatCard
        title="Monthly Profit"
        value={profit}
        icon={<TrendingUp className="h-6 w-6 text-white" />}
        iconBgColor="bg-green-500"
        footer={
          <div className="text-sm">
            <Link href="/portfolio">
              <a className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                View analytics
              </a>
            </Link>
          </div>
        }
      />
      
      <StatCard
        title="Pending Transactions"
        value={pendingTransactions.toString()}
        icon={<Clock className="h-6 w-6 text-white" />}
        iconBgColor="bg-yellow-500"
        footer={
          <div className="text-sm">
            <Link href="/transactions">
              <a className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Review transactions
              </a>
            </Link>
          </div>
        }
      />
    </div>
  );
};

export default AccountSummary;
