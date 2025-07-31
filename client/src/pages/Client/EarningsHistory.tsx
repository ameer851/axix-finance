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
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  Percent,
  Clock
} from 'lucide-react';

// API Functions
const fetchEarningsHistory = async (userId: number, filters: any = {}) => {
  const searchParams = new URLSearchParams();
  
  if (filters.dateFrom) searchParams.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) searchParams.append('dateTo', filters.dateTo);
  if (filters.planType) searchParams.append('planType', filters.planType);
  if (filters.limit) searchParams.append('limit', filters.limit.toString());
  if (filters.offset) searchParams.append('offset', filters.offset.toString());

  try {
    const response = await fetch(`/api/users/${userId}/earnings?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch earnings: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('JSON parse error for earnings:', jsonError);
      return {
        earnings: [],
        totalEarnings: 0,
        totalCount: 0,
        hasMore: false,
        error: 'Failed to parse earnings data.'
      };
    let errorMessage = 'Failed to fetch earnings.';
    if (jsonError instanceof Error) {
      errorMessage = (jsonError as Error).message;
    } else if (typeof jsonError === 'string') {
      errorMessage = jsonError as string;
    }
    return {
      earnings: [],
      totalEarnings: 0,
      totalCount: 0,
      hasMore: false,
      error: errorMessage
    };
    }
    return {
      earnings: data.earnings || data || [],
      totalEarnings: data.totalEarnings || 0,
      totalCount: data.totalCount || data.length || 0,
      hasMore: data.hasMore || false
    };
  } catch (error: unknown) {
    console.error('Earnings history fetch error:', error);
    let errorMessage = 'Failed to fetch earnings.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error as string;
    }
    return {
      earnings: [],
      totalEarnings: 0,
      totalCount: 0,
      hasMore: false,
      error: errorMessage
    };
  }
};

const EarningsHistory: React.FC = () => {
  const { user } = useAuth();
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    planType: '',
    search: '',
    limit: 20,
    offset: 0
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Query for earnings history
  const {
    data: earningsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['earningsHistory', user?.id, filters, page],
    queryFn: () => fetchEarningsHistory(user!.id, { ...filters, offset: (page - 1) * filters.limit }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const earnings = earningsData?.earnings || [];
  const totalEarnings = earningsData?.totalEarnings || 0;
  const totalCount = earningsData?.totalCount || 0;
  const apiError = earningsData?.error;

  // Handlers
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      planType: '',
      search: '',
      limit: 20,
      offset: 0
    });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      // This would be implemented based on your export functionality
      const blob = await fetch(`/api/users/${user?.id}/earnings/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
        credentials: 'include'
      }).then(res => res.blob());
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `earnings-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getEarningTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'daily_return':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'referral_bonus':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'bonus':
        return <Percent className="w-4 h-4 text-purple-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEarningTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'daily_return':
        return <Badge className="bg-green-100 text-green-800">Daily Return</Badge>;
      case 'referral_bonus':
        return <Badge className="bg-blue-100 text-blue-800">Referral Bonus</Badge>;
      case 'bonus':
        return <Badge className="bg-purple-100 text-purple-800">Bonus</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type || 'Unknown'}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to view your earnings history.</p>
        </div>
      </div>
    );
  }
  if (apiError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{apiError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Earnings History
          </h1>
          <p className="text-gray-600 mt-1">Track your investment returns and bonuses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${earnings.filter((e: { createdAt: string; amount: string }) => {
                    const earnDate = new Date(e.createdAt);
                    const now = new Date();
                    return earnDate.getMonth() === now.getMonth() && 
                           earnDate.getFullYear() === now.getFullYear();
                  }).reduce((sum: number, e: { amount: string }) => sum + parseFloat(e.amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Earning Type</label>
                <Select value={filters.planType} onValueChange={(value) => handleFilterChange('planType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="daily_return">Daily Return</SelectItem>
                    <SelectItem value="referral_bonus">Referral Bonus</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">Failed to load earnings history</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-2">
                  Try Again
                </Button>
              </div>
            </div>
          ) : earnings.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No earnings found</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Source</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((earning: any, index: number) => (
                    <tr key={earning.id || index} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(earning.createdAt).toLocaleDateString()} {' '}
                            {new Date(earning.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getEarningTypeIcon(earning.type)}
                          {getEarningTypeBadge(earning.type)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-green-600">
                          +${parseFloat(earning.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {earning.source || earning.planName || 'Investment'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-green-100 text-green-800">
                          Credited
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalCount > filters.limit && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * filters.limit + 1} to {Math.min(page * filters.limit, totalCount)} of {totalCount} earnings
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {Math.ceil(totalCount / filters.limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(totalCount / filters.limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsHistory;
