import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  History as HistoryIcon, 
  TrendingUp, 
  ArrowUpDown,
  CreditCard
} from 'lucide-react';
import NewTransactionHistory from './NewTransactionHistory';
import EarningsHistory from './EarningsHistory';

const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  const tabs = [
    {
      id: 'transactions',
      label: 'Transaction History',
      icon: <ArrowUpDown className="w-4 h-4" />,
      component: <NewTransactionHistory />
    },
    {
      id: 'earnings',
      label: 'Earnings History',
      icon: <TrendingUp className="w-4 h-4" />,
      component: <EarningsHistory />
    },
    {
      id: 'deposits',
      label: 'Deposits & Withdrawals',
      icon: <CreditCard className="w-4 h-4" />,
      component: <NewTransactionHistory />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HistoryIcon className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold">History</h1>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`flex-1 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Tab Content */}
      <div>
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default History;
