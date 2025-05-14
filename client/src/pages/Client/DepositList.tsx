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
import { Search, Download, Filter, ChevronDown } from 'lucide-react';
import { getUserDeposits } from '@/services/transactionService';
import { formatCurrency, formatDate } from '@/lib/utils';

const DepositList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch user deposits
  const { data: deposits = [], isLoading, isError } = useQuery({
    queryKey: ['deposits', user?.id],
    queryFn: () => getUserDeposits(user?.id),
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    retry: 2
  });

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

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Deposit History</CardTitle>
              <CardDescription>View all your past deposits</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="shrink-0">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search deposits..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="from-date" className="sr-only">From Date</Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      placeholder="From"
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-date" className="sr-only">To Date</Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="To"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <Label htmlFor="status-filter" className="sr-only">Status</Label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 pl-3 pr-10 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                </div>
              </div>
            </div>
            
            {/* Deposits Table */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredDeposits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No deposits found</p>
              </div>
            ) : (
              <div className="rounded-md border">
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
                    {filteredDeposits.map((deposit: any) => (
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositList;
