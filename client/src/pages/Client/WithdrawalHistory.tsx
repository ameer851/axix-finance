import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Download, 
  Filter, 
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// API function to fetch withdrawal history
const fetchWithdrawalHistory = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}/withdrawals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch withdrawal history: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
      if (!Array.isArray(data) && !Array.isArray(data.withdrawals)) {
        throw new Error('Invalid withdrawal history format');
      }
      return Array.isArray(data) ? { withdrawals: data } : data;
    } catch (jsonError) {
      console.error('JSON parse error for withdrawal history:', jsonError);
      return { withdrawals: [], error: 'Failed to parse withdrawal history data.' };
    }
  } catch (error) {
    console.error('Withdrawal history fetch error:', error);
    let errorMessage = 'Failed to fetch withdrawal history.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return { withdrawals: [], error: errorMessage };
  }
};

const WithdrawalHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch withdrawal history
  const {
    data: withdrawalData = {},
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['withdrawalHistory', user?.id],
    queryFn: () => fetchWithdrawalHistory(user?.id as number),
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    retry: 2
  });
  const withdrawalHistory = Array.isArray(withdrawalData.withdrawals) ? withdrawalData.withdrawals : (Array.isArray(withdrawalData) ? withdrawalData : []);
  const apiError = withdrawalData.error;

  // Handle error with toast
  React.useEffect(() => {
    if (apiError) {
      toast({
        title: 'Failed to load withdrawal history',
        description: apiError,
        variant: 'destructive'
      });
    }
  }, [apiError, toast]);

  // Filter and sort withdrawals
  const filteredWithdrawals = withdrawalHistory.filter((withdrawal: any) => {
    const matchesSearch = searchTerm === '' || 
      withdrawal.id.toString().includes(searchTerm) || 
      withdrawal.method.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a: any, b: any) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 text-white"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500 text-white"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white"><AlertCircle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Date', 'Amount', 'Method', 'Status', 'Wallet Address'];
      const csvData = filteredWithdrawals.map((withdrawal: any) => [
        withdrawal.id,
        formatDate(withdrawal.createdAt),
        withdrawal.amount,
        withdrawal.method,
        withdrawal.status,
        withdrawal.walletAddress || 'N/A'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map((row: any[]) => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `withdrawal_history_${formatDate(new Date())}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Your withdrawal history has been exported to CSV.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export withdrawal history. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Calculate summary statistics
  const totalWithdrawn = filteredWithdrawals.reduce((sum: number, w: any) => sum + w.amount, 0);
  const completedWithdrawals = filteredWithdrawals.filter((w: any) => w.status === 'completed').length;
  const pendingWithdrawals = filteredWithdrawals.filter((w: any) => w.status === 'pending').length;

  if (apiError) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Failed to retrieve withdrawal history</h3>
                <p className="text-gray-600 mt-2">{apiError}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Withdrawal History</h1>
            <p className="text-gray-600 mt-1">Track all your withdrawal requests and their status</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalWithdrawn)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedWithdrawals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingWithdrawals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search withdrawals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <div></div>
              
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                  <SelectItem value="status-asc">Status (A to Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History ({filteredWithdrawals.length} records)</CardTitle>
            <CardDescription>Complete history of your withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ArrowUpRight className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No withdrawals found matching your criteria.</p>
                {searchTerm || statusFilter !== 'all' ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.map((withdrawal: any) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-medium">#{withdrawal.id}</TableCell>
                        <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(withdrawal.amount)}</TableCell>
                        <TableCell className="capitalize">{withdrawal.method}</TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {withdrawal.walletAddress ? 
                              `${withdrawal.walletAddress.slice(0, 8)}...${withdrawal.walletAddress.slice(-8)}` : 
                              'N/A'
                            }
                          </code>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawalHistory;
