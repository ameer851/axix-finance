import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
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

const AdminAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
    to: new Date()
  });

  // Fetch analytics data
  const { data: analyticsData = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        return await response.json();
      } catch (error) {
        toast({
          title: 'Error fetching analytics data',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive'
        });
        return [];
      }
    }
  });

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

  // Custom colors for charts
  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706'];

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
              onSelect={setDateRange}
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
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
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
                    <BarChart
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
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;