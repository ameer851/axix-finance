import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  Download,
  Search,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

// API Functions
const fetchTransactionHistory = async (userId: number, filters: any = {}) => {
  const searchParams = new URLSearchParams();
  
  if (filters.type) searchParams.append('type', filters.type);
  if (filters.status) searchParams.append('status', filters.status);
  if (filters.dateFrom) searchParams.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) searchParams.append('dateTo', filters.dateTo);
  if (filters.search) searchParams.append('search', filters.search);
  if (filters.limit) searchParams.append('limit', filters.limit.toString());
  if (filters.offset) searchParams.append('offset', filters.offset.toString());

  try {
    const response = await fetch(`/api/users/${userId}/transactions?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data = await response.json();
    return {
      transactions: data.transactions || data || [],
      totalCount: data.totalCount || data.length || 0,
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error('Transaction history fetch error:', error);
    // Return fallback data instead of throwing
    return {
      transactions: [],
      totalCount: 0,
      hasMore: false
    };
  }
};

const exportTransactions = async (userId: number, filters: any = {}) => {
  const searchParams = new URLSearchParams();
  
  if (filters.type) searchParams.append('type', filters.type);
  if (filters.status) searchParams.append('status', filters.status);
  if (filters.dateFrom) searchParams.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) searchParams.append('dateTo', filters.dateTo);
  
  const response = await fetch(`/api/users/${userId}/transactions/export?${searchParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to export transactions');
  }

  return response.blob();
};

const NewTransactionHistory: React.FC = () => {
  const { user } = useAuth();
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    limit: 20,
    offset: 0
  });
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch transaction history
  const { 
    data: transactionData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['transactionHistory', user?.id, filters],
    queryFn: () => fetchTransactionHistory(user?.id as number, filters),
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 2
  });

  const transactions = transactionData?.transactions || [];
  const totalCount = transactionData?.totalCount || 0;
  const hasMore = transactionData?.hasMore || false;

  // Handle filter changes
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: '',
      limit: 20,
      offset: 0
    });
  };

  const loadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  // Export transactions
  const handleExport = async () => {
    try {
      const blob = await exportTransactions(user?.id as number, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction type icon and color
  const getTransactionIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
        return { icon: ArrowDownRight, color: 'text-green-600' };
      case 'withdrawal':
        return { icon: ArrowUpRight, color: 'text-red-600' };
      case 'investment':
        return { icon: DollarSign, color: 'text-blue-600' };
      default:
        return { icon: DollarSign, color: 'text-gray-600' };
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: X }
    };
    
    const style = styles[status?.toLowerCase() as keyof typeof styles] || styles.pending;
    const Icon = style.icon;
    
    return (
      <Badge className={`${style.bg} ${style.text} border-0 text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 20 && value !== 0
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <History className="h-8 w-8 text-blue-600" />
          Transaction History
        </h1>
        <p className="text-gray-600 mt-2">
          View and manage your transaction history.
        </p>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {isFiltersOpen ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Controls */}
          {isFiltersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="profit">Profit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Active Filters & Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Active filters:</span>
                {filters.type && <Badge variant="secondary">{filters.type}</Badge>}
                {filters.status && <Badge variant="secondary">{filters.status}</Badge>}
                {filters.dateFrom && <Badge variant="secondary">From: {filters.dateFrom}</Badge>}
                {filters.dateTo && <Badge variant="secondary">To: {filters.dateTo}</Badge>}
                {filters.search && <Badge variant="secondary">Search: {filters.search}</Badge>}
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Transactions ({totalCount})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-4" />
              <p>Error loading transactions</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results.' 
                  : 'You haven\'t made any transactions yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction: any, index: number) => {
                      const { icon: Icon, color } = getTransactionIcon(transaction.type);
                      return (
                        <tr key={transaction.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 ${color}`} />
                              <span className="font-medium capitalize">
                                {transaction.type || 'Transaction'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`font-semibold ${
                              transaction.type === 'deposit' || transaction.type === 'profit' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.type === 'deposit' || transaction.type === 'profit' ? '+' : '-'}
                              {formatCurrency(Number(transaction.amount) || 0)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(transaction.status || 'pending')}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {formatDate(transaction.createdAt || transaction.date || new Date().toISOString())}
                          </td>
                          <td className="py-4 px-4 text-gray-500 font-mono text-sm">
                            {transaction.transactionHash || transaction.reference || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {transactions.map((transaction: any, index: number) => {
                  const { icon: Icon, color } = getTransactionIcon(transaction.type);
                  return (
                    <div key={transaction.id || index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${color}`} />
                          <span className="font-medium capitalize">
                            {transaction.type || 'Transaction'}
                          </span>
                        </div>
                        {getStatusBadge(transaction.status || 'pending')}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className={`font-semibold ${
                            transaction.type === 'deposit' || transaction.type === 'profit' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' || transaction.type === 'profit' ? '+' : '-'}
                            {formatCurrency(Number(transaction.amount) || 0)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="text-sm">
                            {formatDate(transaction.createdAt || transaction.date || new Date().toISOString())}
                          </span>
                        </div>
                        
                        {(transaction.transactionHash || transaction.reference) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reference:</span>
                            <span className="text-sm font-mono">
                              {transaction.transactionHash || transaction.reference}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mt-6">
                  <Button variant="outline" onClick={loadMore}>
                    Load More Transactions
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewTransactionHistory;
