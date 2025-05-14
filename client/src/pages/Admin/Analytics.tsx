import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CalendarIcon,
  Download,
  TrendingUp,
  Users,
  ArrowLeftRight,
  BarChart
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  Area,
  AreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import { exportLogs, exportUsers } from '@/services/adminService';
import { DateRange } from "react-day-picker";

import { getAnalyticsData, AnalyticsData } from '@/services/adminService';

const AdminAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
    to: new Date()
  });

  // Custom colors for charts
  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706'];

  // Fetch analytics data with date range support
  const { data: analyticsData, isLoading: analyticsLoading, isError: analyticsError } = useQuery({
    queryKey: ['/api/admin/analytics', dateRange],
    queryFn: async () => {
      try {
        // Make sure both from and to dates are defined before calling API
        if (dateRange && dateRange.from && dateRange.to) {
          return await getAnalyticsData(dateRange);
        }
        // If date range is incomplete, use default range
        return await getAnalyticsData();
      } catch (error) {
        console.error('Error in analytics query function:', error);
        // Return a safe fallback data structure
        return {
          userDemographics: [],
          retentionData: [],
          userActivityData: [],
          transactionValueData: [],
          avgTransactionValues: [],
          revenueData: [],
          userGrowth: []
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });
  
  // Handle analytics error
  useEffect(() => {
    if (analyticsError) {
      toast({
        title: 'Error fetching analytics data',
        description: analyticsError instanceof Error ? analyticsError.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }, [analyticsError, toast]);

  // Fetch transaction data for pie chart
  const { data: transactionData = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/transactions');
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        return await response.json();
      } catch (error) {
        toast({
          title: 'Error fetching transactions',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive'
        });
        return [];
      }
    }
  });

  // Calculate transaction types for pie chart
  const transactionTypeData = React.useMemo(() => {
    const typeCount: Record<string, number> = {
      deposit: 0,
      withdrawal: 0,
      transfer: 0,
      investment: 0
    };
    
    transactionData.forEach((transaction: any) => {
      if (transaction.type && typeCount[transaction.type] !== undefined) {
        typeCount[transaction.type]++;
      }
    });
    
    return Object.entries(typeCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [transactionData]);

  // Handle export actions
  const handleExportUsers = async () => {
    try {
      await exportUsers();
      toast({
        title: 'Export started',
        description: 'The user data export has been initiated. The file will download shortly.'
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleExportLogs = async () => {
    try {
      await exportLogs();
      toast({
        title: 'Export started',
        description: 'The logs export has been initiated. The file will download shortly.'
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Detailed platform performance and activity metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleExportUsers}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
          <Button
            onClick={handleExportLogs}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className="w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                  </>
                ) : (
                  formatDate(dateRange.from)
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => range && setDateRange(range)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary-500" />
                  Platform Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {analyticsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analyticsData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stackId="1"
                          stroke="#2563eb" 
                          fill="#93c5fd" 
                          name="Users"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="transactions" 
                          stackId="1"
                          stroke="#16a34a" 
                          fill="#86efac" 
                          name="Transactions"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowLeftRight className="mr-2 h-5 w-5 text-primary-500" />
                  Transaction Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {transactionsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={transactionTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {transactionTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary-500" />
                  User Registration Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {analyticsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analyticsData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          name="New Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary-500" />
                  User Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {analyticsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '18-24', value: 15 },
                            { name: '25-34', value: 35 },
                            { name: '35-44', value: 25 },
                            { name: '45-54', value: 15 },
                            { name: '55+', value: 10 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {[...Array(5)].map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary-500" />
                  User Retention Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {analyticsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Jan', retention: 95 },
                          { month: 'Feb', retention: 92 },
                          { month: 'Mar', retention: 88 },
                          { month: 'Apr', retention: 85 },
                          { month: 'May', retention: 82 },
                          { month: 'Jun', retention: 78 },
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Retention Rate']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="retention" 
                          stroke="#16a34a" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          name="Retention Rate (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary-500" />
                  User Activity Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {analyticsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={[
                          { category: 'Daily Active', count: 1250 },
                          { category: 'Weekly Active', count: 3450 },
                          { category: 'Monthly Active', count: 5800 },
                          { category: 'Inactive', count: 2200 },
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          fill="#2563eb" 
                          name="User Count"
                          barSize={40}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-primary-500" />
                  Transaction Volume by Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {analyticsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={analyticsData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="transactions" 
                          fill="#2563eb" 
                          name="Transaction Count"
                          barSize={40}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowLeftRight className="mr-2 h-5 w-5 text-primary-500" />
                  Transaction Types Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {transactionsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={transactionTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {transactionTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary-500" />
                  Transaction Value Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {transactionsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Jan', deposit: 250000, withdrawal: 120000, investment: 320000 },
                          { month: 'Feb', deposit: 320000, withdrawal: 140000, investment: 380000 },
                          { month: 'Mar', deposit: 280000, withdrawal: 190000, investment: 420000 },
                          { month: 'Apr', deposit: 340000, withdrawal: 220000, investment: 380000 },
                          { month: 'May', deposit: 390000, withdrawal: 240000, investment: 450000 },
                          { month: 'Jun', deposit: 420000, withdrawal: 260000, investment: 520000 },
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="deposit" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          name="Deposits"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="withdrawal" 
                          stroke="#dc2626" 
                          strokeWidth={2}
                          name="Withdrawals"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="investment" 
                          stroke="#16a34a" 
                          strokeWidth={2}
                          name="Investments"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-primary-500" />
                  Average Transaction Value by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {transactionsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={[
                          { type: 'Deposit', value: 8500 },
                          { type: 'Withdrawal', value: 6200 },
                          { type: 'Transfer', value: 4800 },
                          { type: 'Investment', value: 12500 },
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Average Value']} />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Average Value ($)"
                          barSize={40}
                        >
                          {[...Array(4)].map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;