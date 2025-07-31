import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Filter, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import { getUserDeposits } from '@/services/transactionService';
import { formatCurrency, formatDate } from '@/lib/utils';

const DepositList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch user deposits
  const { data: deposits = [], isLoading, isError, error } = useQuery({
    queryKey: ['deposits', user?.id],
    queryFn: () => getUserDeposits(user?.id),
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    retry: 2
  });

  // Handle error with toast
  React.useEffect(() => {
    if (isError && error) {
      console.error('Deposits fetch error:', error);
      toast({
        title: 'Failed to retrieve deposits',
        description: (error as any)?.message || 'Unable to load your deposits. Please refresh the page.',
        variant: 'destructive'
      });
    }
  }, [isError, error, toast]);

  // Show error state
  if (isError) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Failed to retrieve deposits</h3>
                <p className="text-gray-600 mt-2">{error?.message || 'Unable to load your deposits data.'}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your deposits...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle search and filtering
  const filteredDeposits = deposits.filter((deposit: any) => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      deposit.id.toString().includes(searchTerm) || 
      deposit.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date range filter
    const depositDate = new Date(deposit.createdAt);
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;
    
    const isAfterFromDate = fromDate ? depositDate >= fromDate : true;
    const isBeforeToDate = toDate ? depositDate <= toDate : true;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter;
    
    return matchesSearch && isAfterFromDate && isBeforeToDate && matchesStatus;
  });

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Export deposits as CSV
  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Date', 'Amount', 'Method', 'Status'];
      const csvData = filteredDeposits.map((deposit: any) => [
        deposit.id,
        formatDate(deposit.createdAt),
        deposit.amount,
        deposit.method,
        deposit.status
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `deposits_${formatDate(new Date())}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Your deposits have been exported to CSV.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your deposits.',
        variant: 'destructive'
      });
    }
  };

  if (isError) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Deposit History</CardTitle>
            <CardDescription>There was an error loading your deposit history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Plans definition (ensure this matches your backend/plan logic)
  const plans = [
    {
      id: 'starter',
      name: 'Starter plan',
      spentRange: '$150.00 - $999.00',
      dailyProfit: 1.5,
    },
    {
      id: 'premium',
      name: 'Premium plan',
      spentRange: '$1000.00 - $4999.00',
      dailyProfit: 3.0,
    },
    {
      id: 'deluxe',
      name: 'Deluxe plan',
      spentRange: '$5000.00 - $19999.00',
      dailyProfit: 5.0,
    },
    {
      id: 'luxury',
      name: 'Luxury plan',
      spentRange: '$20,000-UNLIMITED',
      dailyProfit: 7.5,
    },
  ];

  // Group deposits by plan
  const depositsByPlan = plans.reduce((acc, plan) => {
    acc[plan.id] = filteredDeposits.filter((d: any) => d.plan === plan.id);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate total deposited
  const totalDeposited = filteredDeposits.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-bold text-amber-900">Your deposits</CardTitle>
          <CardDescription className="text-amber-700 font-medium mt-1">Total: <span className="font-bold">{formatCurrency(totalDeposited)}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* For each plan */}
          {plans.map(plan => (
            <div key={plan.id} className="mb-8">
              <div className="border-b border-amber-200 pb-1 mb-2 flex flex-col md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="font-semibold text-amber-800 text-base md:text-lg">{plan.name}</div>
                  <div className="flex flex-wrap gap-4 text-xs text-amber-700 mt-1">
                    <span>Amount Spent ($): <span className="font-medium">{plan.spentRange}</span></span>
                    <span>Daily Profit (%): <span className="font-medium">{plan.dailyProfit}</span></span>
                  </div>
                </div>
              </div>
              {/* Table or no deposits */}
              {depositsByPlan[plan.id] && depositsByPlan[plan.id].length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depositsByPlan[plan.id].map((deposit: any) => (
                        <TableRow key={deposit.id}>
                          <TableCell className="font-medium">#{deposit.id}</TableCell>
                          <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                          <TableCell>{formatCurrency(deposit.amount)}</TableCell>
                          <TableCell className="capitalize">{deposit.method}</TableCell>
                          <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-xs font-semibold text-amber-900 py-3">No deposits for this plan</div>
              )}
            </div>
          ))}
          {/* Export button at bottom */}
          <div className="flex justify-end">
            <Button onClick={exportToCSV} variant="outline" className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DepositList;

