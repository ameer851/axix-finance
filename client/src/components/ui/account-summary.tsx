import React from 'react';
import { Link } from 'wouter';
import StatCard from '@/components/ui/stat-card';
import { LucideIcon } from 'lucide-react';

interface AccountSummaryProps {
  title: string;
  amount: string | number;
  change?: number;
  icon: React.ReactNode;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({
  title,
  amount,
  change = 0,
  icon
}) => {
  return (
    <StatCard
      title={title}
      value={typeof amount === 'string' ? amount : amount.toString()}
      icon={icon}
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
  );
};

export default AccountSummary;
