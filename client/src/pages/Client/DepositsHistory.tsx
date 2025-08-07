import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
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
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// API function to fetch deposits history
const fetchDepositsHistory = async (userId: number) => {
  try {
    const data = await apiFetch(`/api/users/${userId}/deposits-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
    if (Array.isArray(data)) {
      return { deposits: data };
    } else if (Array.isArray(data.deposits)) {
      return data;
    } else {
      throw new Error('Invalid deposits history format');
    }
  } catch (error: any) {
    let errorMessage = 'Failed to fetch deposits history.';
    if (error && error.message) {
      errorMessage = error.message;
    }
    if (error && error.status) {
      console.error('API error fetching deposits history:', error);
    } else {
      console.error('Error fetching deposits history:', error);
    }
    return { deposits: [], error: errorMessage };
  }
};

const DepositsHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {
    data,
    error: apiError,
    refetch,
    isLoading,
  } = useQuery(['depositsHistory', user?.id], () => user?.id ? fetchDepositsHistory(user.id) : Promise.resolve({ deposits: [] }), {
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  const deposits = data?.deposits || [];
  const filteredDeposits = deposits
    .filter((deposit: any) => {
      const matchesSearch =
        deposit.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.method.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter;
      const matchesPlan = planFilter === 'all' || deposit.plan.includes(planFilter.toUpperCase());
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a: any, b: any) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'plan':
          aValue = a.plan;
          bValue = b.plan;
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
      case 'active':
        return <Badge className="bg-blue-500 text-white"><TrendingUp className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white"><AlertCircle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  // Get plan badge color
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'STARTER PLAN':
        return <Badge className="bg-green-100 text-green-800">{plan}</Badge>;
      case 'PREMIUM PLAN':
        return <Badge className="bg-blue-100 text-blue-800">{plan}</Badge>;
      case 'DELUX PLAN':
        return <Badge className="bg-purple-100 text-purple-800">{plan}</Badge>;
      case 'LUXURY PLAN':
        return <Badge className="bg-amber-100 text-amber-800">{plan}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{plan}</Badge>;
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Date', 'Amount', 'Plan', 'Method', 'Status', 'Daily Return %', 'Duration (Days)', 'Earned Amount', 'Remaining Days'];
      const csvData = filteredDeposits.map((deposit: any) => [
        deposit.id,
        formatDate(deposit.createdAt),
        deposit.amount,
        deposit.plan,
        deposit.method,
        deposit.status,
        deposit.dailyReturn,
        deposit.duration,
        deposit.earnedAmount || 0,
        deposit.remainingDays || 0
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map((row: any[]) => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `deposits_history_${formatDate(new Date())}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Your deposits history has been exported to CSV.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export deposits history. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Calculate summary statistics
  const totalDeposited = filteredDeposits.reduce((sum: number, d: any) => sum + d.amount, 0);
  const totalEarned = filteredDeposits.reduce((sum: number, d: any) => sum + (d.earnedAmount || 0), 0);
  const activeDeposits = filteredDeposits.filter((d: any) => d.status === 'active').length;

  if (apiError) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Failed to retrieve deposits history</h3>
                <p className="text-gray-600 mt-2">{apiError}</p>
                <Button onClick={() => (typeof refetch === 'function' ? refetch() : null)} variant="outline" className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Deposits History</h1>
            <p className="text-gray-600 mt-1">Track all your investment deposits and their performance</p>
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
                  <p className="text-sm text-gray-600">Total Deposited</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDeposited)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarned)}</p>
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
                  <p className="text-sm text-gray-600">Active Deposits</p>
                  <p className="text-2xl font-bold text-gray-900">{activeDeposits}</p>
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
                  placeholder="Search deposits..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>

        {/* Deposits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Deposits History ({filteredDeposits.length} records)</CardTitle>
            <CardDescription>Complete history of your investment deposits and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No deposits found matching your criteria.</p>
                {searchTerm || statusFilter !== 'all' || planFilter !== 'all' ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPlanFilter('all');
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
                      <TableHead>Plan</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Daily Return</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Earned</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeposits.map((deposit: any) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-medium">#{deposit.id}</TableCell>
                        <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(deposit.amount)}</TableCell>
                        <TableCell>{getPlanBadge(deposit.plan)}</TableCell>
                        <TableCell className="capitalize">{deposit.method}</TableCell>
                        <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                        <TableCell className="text-green-600 font-medium">{deposit.dailyReturn}%</TableCell>
                        <TableCell>{deposit.duration} days</TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          {formatCurrency(deposit.earnedAmount || 0)}
                        </TableCell>
                        <TableCell>
                          {deposit.status === 'active' ? (
                            <span className="text-orange-600 font-medium">{deposit.remainingDays} days</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
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

export default DepositsHistory;
