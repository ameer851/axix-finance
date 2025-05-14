import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  DollarSign, 
  RefreshCw
} from 'lucide-react';
import { getUserPortfolio, PortfolioData } from '@/services/portfolioService';

// Colors for the pie chart - using our brown theme
const COLORS = ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3'];

interface PortfolioOverviewProps {
  onDeposit: () => void;
  onWithdraw: () => void;
  onInvest: () => void;
  onRebalance: () => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  onDeposit,
  onWithdraw,
  onInvest,
  onRebalance
}) => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('1M');
  
  // Fetch portfolio data from API
  const { data: portfolioData, isLoading, isError } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: () => getUserPortfolio(user?.id),
    enabled: !!user?.id,
    staleTime: 60000 // 1 minute
  });
  
  // Format allocation data for pie chart
  const getAllocationData = () => {
    if (!portfolioData) return [];
    
    return Object.entries(portfolioData.allocation).map(([key, value], index) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
      color: COLORS[index % COLORS.length]
    }));
  };
  
  // Format currency
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };
  
  // Format percentage
  const formatPercentage = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };
  
  // Get performance data based on timeframe
  const getPerformanceData = () => {
    if (!portfolioData) return [];
    
    // Filter data based on timeframe
    const { performanceData } = portfolioData;
    const today = new Date();
    
    switch (timeframe) {
      case '1W':
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        return performanceData.filter((item: any) => new Date(item.date) >= oneWeekAgo);
      case '1M':
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        return performanceData.filter((item: any) => new Date(item.date) >= oneMonthAgo);
      case '3M':
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        return performanceData.filter((item: any) => new Date(item.date) >= threeMonthsAgo);
      case '1Y':
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return performanceData.filter((item: any) => new Date(item.date) >= oneYearAgo);
      case 'All':
      default:
        return performanceData;
    }
  };
  
  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{`${payload[0].value.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom tooltip for area chart
  const AreaChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Portfolio Overview</CardTitle>
          <CardDescription>Loading your investment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError || !portfolioData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Portfolio Overview</CardTitle>
          <CardDescription>There was an error loading your investment data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
            <p className="text-muted-foreground">We couldn't load your portfolio data at this time.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 bg-amber-50">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl text-amber-900">Portfolio Overview</CardTitle>
              <CardDescription>Your investment summary and performance</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onDeposit} className="bg-white hover:bg-amber-50 text-amber-900 border-amber-200">
                <DollarSign className="h-4 w-4 mr-1" />
                Deposit
              </Button>
              <Button variant="outline" size="sm" onClick={onWithdraw} className="bg-white hover:bg-amber-50 text-amber-900 border-amber-200">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                Withdraw
              </Button>
              <Button variant="outline" size="sm" onClick={onInvest} className="bg-white hover:bg-amber-50 text-amber-900 border-amber-200">
                <TrendingUp className="h-4 w-4 mr-1" />
                Invest
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Total Portfolio Value */}
          <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-amber-100">
            <h3 className="text-sm font-medium text-amber-800 mb-1">Total Portfolio Value</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-amber-900">{formatCurrency(portfolioData.totalValue)}</span>
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {formatPercentage(portfolioData.profitPercentage)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-700">Cash Balance</p>
                <p className="font-medium text-amber-900">{formatCurrency(portfolioData.cashBalance)}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-700">Invested Amount</p>
                <p className="font-medium text-amber-900">{formatCurrency(portfolioData.investedAmount)}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-700">Total Profit</p>
                <p className="font-medium text-green-600">{formatCurrency(portfolioData.totalProfit)}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-700">Profit %</p>
                <p className="font-medium text-green-600">{formatPercentage(portfolioData.profitPercentage)}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Allocation */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-100">
              <h3 className="text-sm font-medium text-amber-800 mb-4">Asset Allocation</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getAllocationData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {getAllocationData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-between text-xs text-amber-700 mt-2">
                {Object.entries(portfolioData.allocation).map(([key, value]) => (
                  <span key={key} className="mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)}: {value.toFixed(1)}%
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <Progress value={75} className="h-2 bg-amber-100" />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-amber-700">Your portfolio is properly balanced</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-amber-900" onClick={onRebalance}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Rebalance
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Performance Chart */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-amber-800">Performance</h3>
                <div className="flex flex-wrap gap-1">
                  <Button 
                    variant={timeframe === '1W' ? 'default' : 'outline'} 
                    size="sm" 
                    className={timeframe === '1W' 
                      ? 'h-7 px-2 bg-amber-800 hover:bg-amber-700' 
                      : 'h-7 px-2 border-amber-200 text-amber-800 hover:bg-amber-50'
                    }
                    onClick={() => setTimeframe('1W')}
                  >
                    1W
                  </Button>
                  <Button 
                    variant={timeframe === '1M' ? 'default' : 'outline'} 
                    size="sm" 
                    className={timeframe === '1M' 
                      ? 'h-7 px-2 bg-amber-800 hover:bg-amber-700' 
                      : 'h-7 px-2 border-amber-200 text-amber-800 hover:bg-amber-50'
                    }
                    onClick={() => setTimeframe('1M')}
                  >
                    1M
                  </Button>
                  <Button 
                    variant={timeframe === '3M' ? 'default' : 'outline'} 
                    size="sm" 
                    className={timeframe === '3M' 
                      ? 'h-7 px-2 bg-amber-800 hover:bg-amber-700' 
                      : 'h-7 px-2 border-amber-200 text-amber-800 hover:bg-amber-50'
                    }
                    onClick={() => setTimeframe('3M')}
                  >
                    3M
                  </Button>
                  <Button 
                    variant={timeframe === '1Y' ? 'default' : 'outline'} 
                    size="sm" 
                    className={timeframe === '1Y' 
                      ? 'h-7 px-2 bg-amber-800 hover:bg-amber-700' 
                      : 'h-7 px-2 border-amber-200 text-amber-800 hover:bg-amber-50'
                    }
                    onClick={() => setTimeframe('1Y')}
                  >
                    1Y
                  </Button>
                  <Button 
                    variant={timeframe === 'All' ? 'default' : 'outline'} 
                    size="sm" 
                    className={timeframe === 'All' 
                      ? 'h-7 px-2 bg-amber-800 hover:bg-amber-700' 
                      : 'h-7 px-2 border-amber-200 text-amber-800 hover:bg-amber-50'
                    }
                    onClick={() => setTimeframe('All')}
                  >
                    All
                  </Button>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getPerformanceData()}>                
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B4513" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B4513" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip content={<AreaChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8B4513" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
