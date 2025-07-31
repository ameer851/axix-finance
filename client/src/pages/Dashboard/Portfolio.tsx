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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { Plus, TrendingUp, DollarSign, Target, Award, Star, Clock, Shield, Zap, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CryptoDepositAddresses from '@/components/CryptoDepositAddresses';

const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);

  // Fetch user transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: [`/users/${userId}/transactions`],
    enabled: !!userId
  });

  // Calculate investment distribution
  const calculateInvestmentDistribution = () => {
    if (!transactions) return [];
    
    const investmentTransactions = transactions.filter(t => 
      t.type === 'investment' && t.status === 'completed'
    );
    
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
  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

  // Enhanced investment plans with modern features and benefits
  const investmentPlans = [
    {
      name: 'STARTER PLAN',
      badge: 'Perfect for Beginners',
      badgeColor: 'bg-green-500',
      minInvestment: 50,
      maxInvestment: 999,
      dailyReturn: 2,
      duration: 3,
      totalReturn: 6,
      features: [
        'Principal Included',
        '10% Referral Commission',
        'Quick 3-day Investment Cycle',
        'Secure Investment Platform',
        'Daily Returns Directly to Your Account'
      ],
      icon: <Target className="h-6 w-6" />,
      gradient: 'from-green-400 to-green-600',
      bgGradient: 'from-green-50 to-emerald-50',
      popular: true
    },
    {
      name: 'PREMIUM PLAN',
      badge: 'Most Popular Choice',
      badgeColor: 'bg-blue-500',
      minInvestment: 1000,
      maxInvestment: 4999,
      dailyReturn: 3.5,
      duration: 7,
      totalReturn: 24.5,
      features: [
        'Principal Included',
        '10% Referral Commission',
        'Extended 7-day Investment Cycle',
        'Priority Customer Support',
        'Higher Daily Percentage Returns'
      ],
      icon: <Award className="h-6 w-6" />,
      gradient: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      popular: false
    },
    {
      name: 'DELUX PLAN',
      badge: 'High Yield Returns',
      badgeColor: 'bg-purple-500',
      minInvestment: 5000,
      maxInvestment: 19999,
      dailyReturn: 5,
      duration: 10,
      totalReturn: 50,
      features: [
        'Principal Included',
        '10% Referral Commission',
        'Premium 10-day Investment Cycle',
        'VIP Customer Support',
        'Superior Daily Percentage Returns'
      ],
      icon: <Star className="h-6 w-6" />,
      gradient: 'from-purple-400 to-purple-600',
      bgGradient: 'from-purple-50 to-pink-50',
      popular: false
    },
    {
      name: 'LUXURY PLAN',
      badge: 'Exclusive Elite Plan',
      badgeColor: 'bg-yellow-500',
      minInvestment: 20000,
      maxInvestment: Infinity,
      dailyReturn: 7.5,
      duration: 30,
      totalReturn: 225,
      features: [
        'Principal Included',
        '10% Referral Commission',
        'Extended 30-day Investment Cycle',
        'Dedicated Account Manager',
        'Maximum Daily Returns'
      ],
      icon: <Trophy className="h-6 w-6" />,
      gradient: 'from-yellow-400 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50',
      popular: false
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full text-sm font-medium text-gray-700">
          <Shield className="h-4 w-4 text-green-600" />
          Secure & Regulated Investment Platform
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
          Investment Plans
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose from our carefully designed investment plans to grow your wealth with guaranteed daily returns
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-green-600" />
            10,000+ Active Investors
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-blue-600" />
            100% Secure Platform
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-purple-600" />
            Instant Activation
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              Portfolio Overview
            </CardTitle>
            <CardDescription className="text-base">Track your investment performance and growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">Total Invested</p>
                <p className="text-2xl font-bold text-green-600">
                  ${investmentDistribution.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">Active Plans</p>
                <p className="text-2xl font-bold text-blue-600">{investmentDistribution.length}</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">Total Returns</p>
                <p className="text-2xl font-bold text-purple-600">$0.00</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <Award className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">ROI</p>
                <p className="text-2xl font-bold text-orange-600">0.00%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="text-xl">Investment Distribution</CardTitle>
            <CardDescription>Your plan allocation breakdown</CardDescription>
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
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {investmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <Clock className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">No Active Investments</h3>
                <p className="text-gray-500 mb-4 text-sm">Start your investment journey today</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    setSelectedPlan('STARTER PLAN');
                    setIsInvestDialogOpen(true);
                  }}
                >
                  Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Plans Grid */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Investment Plan</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            All plans include principal protection, daily returns, and 24/7 customer support
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {investmentPlans.map((plan, index) => (
            <Card
              key={index}
              className={`min-w-[260px] max-w-xs flex-shrink-0 border ${plan.highlighted ? 'border-primary' : 'border-gray-200'} rounded-lg shadow-sm divide-y divide-gray-200`}
            >
              <div className="p-4">
                <h2 className="text-base leading-6 font-bold text-primary">{plan.name}</h2>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-xl font-extrabold text-gray-900">{plan.price}</span>
                </p>
                <p className="mt-1">
                  <span className="text-base font-semibold text-primary">{plan.returnRate}</span>
                </p>
                <Button className="mt-4 block w-full text-base py-3" href={plan.href}>
                  {plan.cta}
                </Button>
              </div>
              <div className="pt-4 pb-4 px-4">
                <h3 className="text-xs font-medium text-gray-900">Features</h3>
                <ul className="mt-3 space-y-2">
                  {plan.features.map((feature, featIndex) => (
                    <li key={featIndex} className="flex space-x-2 items-center">
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Investment Dialog */}
      <Dialog open={isInvestDialogOpen} onOpenChange={setIsInvestDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              Invest in {selectedPlan}
            </DialogTitle>
            <DialogDescription>
              Send funds to any of the cryptocurrency addresses below to start your investment.
              Your investment will be activated within 24 hours of confirmation.
            </DialogDescription>
          </DialogHeader>
          
          <CryptoDepositAddresses />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Portfolio;
