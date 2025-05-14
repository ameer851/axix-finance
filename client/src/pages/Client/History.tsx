import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Filter, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getUserTransactions } from '@/services/transactionService';
import { formatCurrency, formatDate } from '@/lib/utils';

const History: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [transactionType, setTransactionType] = useState('all');
  const [currentTab, setCurrentTab] = useState('all');

  // Fetch user transactions
  const { data: transactions = [], isLoading, isError } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => getUserTransactions(user?.id),
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    retry: 2
  });

  // Handle search and filtering
  const filteredTransactions = transactions.filter((transaction: any) => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      transaction.id.toString().includes(searchTerm) || 
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Date range filter
    const transactionDate = new Date(transaction.createdAt);
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;
    
    const isAfterFromDate = fromDate ? transactionDate >= fromDate : true;
    const isBeforeToDate = toDate ? transactionDate <= toDate : true;
    
    // Transaction type filter
    const matchesType = transactionType === 'all' || transaction.type === transactionType;
    
    // Tab filter
    const matchesTab = currentTab === 'all' || 
      (currentTab === 'deposits' && transaction.type === 'deposit') ||
      (currentTab === 'withdrawals' && transaction.type === 'withdrawal') ||
      (currentTab === 'investments' && transaction.type === 'investment');
    
    return matchesSearch && isAfterFromDate && isBeforeToDate && matchesType && matchesTab;
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

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Export transactions as CSV
  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Date', 'Type', 'Amount', 'Status', 'Description'];
      const csvData = filteredTransactions.map((transaction: any) => [
        transaction.id,
        formatDate(transaction.createdAt),
        transaction.type,
        transaction.amount,
        transaction.status,
        transaction.description || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${formatDate(new Date())}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Your transaction history has been exported to CSV.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your transaction history.',
        variant: 'destructive'
      });
    }
  };

  if (isError) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Transaction History</CardTitle>
            <CardDescription>There was an error loading your transaction history.</CardDescription>
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
              <CardTitle className="text-2xl">Transaction History</CardTitle>
              <CardDescription>View all your past transactions</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="shrink-0">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs defaultValue="all" onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="deposits">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="investments">Investments</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    placeholder="From"
                  />
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="To"
                  />
                </div>
                
                <div className="relative">
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full h-10 pl-3 pr-10 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="investment">Investment</option>
                    <option value="fee">Fee</option>
                    <option value="interest">Interest</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                </div>
              </div>
            </div>
            
            {/* Transactions Table */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">#{transaction.id}</TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getTransactionTypeIcon(transaction.type)}
                            <span className="ml-1 capitalize">{transaction.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className={transaction.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}>
                          {transaction.type === 'withdrawal' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
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

export default History;
