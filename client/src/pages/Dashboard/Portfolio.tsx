import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Transaction } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import CryptoDepositAddresses from '@/components/CryptoDepositAddresses';

const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);

  // Fetch user transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/users/${userId}/transactions`],
    enabled: !!userId
  });

  // Calculate investment distribution
  const calculateInvestmentDistribution = () => {
    if (!transactions) return [];
    
    const investmentTransactions = transactions.filter(t => 
      t.type === 'investment' && t.status === 'completed'
    );
    
    // This would normally come from investment plans or categories in a real app
    // For now we'll create some example categories based on amount ranges
    const investmentsByCategory = investmentTransactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      let category;
      
      if (amount <= 999) {
        category = 'STARTER';
      } else if (amount <= 4999) {
        category = 'PREMIUM';
      } else if (amount <= 19999) {
        category = 'DELUX';
      } else {
        category = 'LUXURY';
      }
      
      if (!acc[category]) {
        acc[category] = 0;
      }
      
      acc[category] += amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(investmentsByCategory).map(([name, value]) => ({
      name,
      value
    }));
  };

  const investmentDistribution = calculateInvestmentDistribution();

  // Colors for pie chart
  const COLORS = ['#8B4513', '#D2691E', '#CD853F', '#DEB887'];

  // Monthly performance data (this would come from API in a real implementation)
  const getMonthlyPerformance = () => {
    const currentYear = new Date().getFullYear();
    return [
      { name: 'Jan', returns: 0 },
      { name: 'Feb', returns: 0 },
      { name: 'Mar', returns: 0 },
      { name: 'Apr', returns: 0 },
      { name: 'May', returns: 0 },
      { name: 'Jun', returns: 0 },
      { name: 'Jul', returns: 0 },
      { name: 'Aug', returns: 0 },
      { name: 'Sep', returns: 0 },
      { name: 'Oct', returns: 0 },
      { name: 'Nov', returns: 0 },
      { name: 'Dec', returns: 0 },
    ];
  };

  const monthlyPerformance = getMonthlyPerformance();

  // Investment plans
  const investmentPlans = [
    {
      name: 'STARTER PLAN',
      minInvestment: 50,
      maxInvestment: 999,
      dailyReturn: 2,
      duration: 3,
      referralCommission: 10,
      principalIncluded: true
    },
    {
      name: 'PREMIUM PLAN',
      minInvestment: 1000,
      maxInvestment: 4999,
      dailyReturn: 3.5,
      duration: 7,
      referralCommission: 10,
      principalIncluded: true
    },
    {
      name: 'DELUX PLAN',
      minInvestment: 5000,
      maxInvestment: 19999,
      dailyReturn: 5,
      duration: 10,
      referralCommission: 10,
      principalIncluded: true
    },
    {
      name: 'LUXURY PLAN',
      minInvestment: 20000,
      maxInvestment: Infinity,
      dailyReturn: 7.5,
      duration: 30,
      referralCommission: 10,
      principalIncluded: true
    }
  ];

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading portfolio data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Investment Portfolio</h1>
        <Button 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={() => {
            setSelectedPlan('STARTER PLAN');
            setIsInvestDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Investment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Investment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Summary</CardTitle>
            <CardDescription>Overview of your current investments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invested</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  ${investmentDistribution.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Investments</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {investmentDistribution.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Returns</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  +$0.00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ROI</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  0.00%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Distribution</CardTitle>
            <CardDescription>Allocation across investment plans</CardDescription>
          </CardHeader>
          <CardContent>
            {investmentDistribution.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investmentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {investmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any active investments yet.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedPlan('STARTER PLAN');
                    setIsInvestDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Start Investing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Monthly return on investments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyPerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="returns" name="Monthly Returns %" fill="#8B4513" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Investment Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Investment Plans</CardTitle>
          <CardDescription>Choose the best plan for your investment goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="starter">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="starter">Starter</TabsTrigger>
              <TabsTrigger value="premium">Premium</TabsTrigger>
              <TabsTrigger value="delux">Delux</TabsTrigger>
              <TabsTrigger value="luxury">Luxury</TabsTrigger>
            </TabsList>
            
            {investmentPlans.map((plan, index) => (
              <TabsContent key={index} value={plan.name.split(' ')[0].toLowerCase()}>
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-bold text-lg">{plan.name}</span>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedPlan(plan.name);
                        setIsInvestDialogOpen(true);
                      }}
                    >
                      Invest Now
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-gray-500 dark:text-gray-400">Investment Range</div>
                    <div className="font-medium">
                      ${plan.minInvestment} - {plan.maxInvestment === Infinity ? 'Unlimited' : `$${plan.maxInvestment}`}
                    </div>
                    
                    <div className="text-gray-500 dark:text-gray-400">Daily Return</div>
                    <div className="font-medium text-green-600 dark:text-green-400">{plan.dailyReturn}%</div>
                    
                    <div className="text-gray-500 dark:text-gray-400">Plan Duration</div>
                    <div className="font-medium">{plan.duration} days</div>
                    
                    <div className="text-gray-500 dark:text-gray-400">Referral Commission</div>
                    <div className="font-medium">{plan.referralCommission}%</div>
                    
                    <div className="text-gray-500 dark:text-gray-400">Principal Return</div>
                    <div className="font-medium">{plan.principalIncluded ? 'Yes, included' : 'No'}</div>
                    
                    <div className="text-gray-500 dark:text-gray-400">Total ROI</div>
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {plan.dailyReturn * plan.duration}%
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Investment Dialog with Crypto Addresses */}
      <Dialog open={isInvestDialogOpen} onOpenChange={setIsInvestDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Invest in {selectedPlan}</DialogTitle>
            <DialogDescription>
              {selectedPlan && 
                `Send funds to any of these cryptocurrency addresses to start your ${selectedPlan.toLowerCase()} investment.`
              }
            </DialogDescription>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4"
              onClick={() => setIsInvestDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <CryptoDepositAddresses />
          
          <DialogFooter>
            <Button onClick={() => setIsInvestDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Portfolio;