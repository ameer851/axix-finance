import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Filter, X, Check, Search, AlertTriangle, Clock, Ban, Info, ChevronDown, ChevronUp, Download, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Transaction } from '@shared/schema';
import { formatCurrency, formatDate, getTransactionTypeColor, getStatusColor } from '@/lib/utils';
import { getPendingTransactions, approveTransaction, rejectTransaction, getUserDetails } from '@/services/adminService';
import { getTransactions, bulkApproveTransactions, bulkRejectTransactions } from '@/services/transactionService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionFilters } from './types';

/**
 * Enhanced transaction management component for Admin Panel
 * Provides real-time approval and rejection of deposit/withdrawal requests
 */
const TransactionsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for transaction filters and pagination
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: undefined,
    status: 'pending',
    dateRange: undefined,
    amountRange: undefined,
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // State for selected transactions for bulk actions
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  
  // State for confirm dialog and rejection dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {}
  });
  
  const [rejectionDialog, setRejectionDialog] = useState<{
    isOpen: boolean;
    transactionId?: number;
    isMultiple: boolean;
    transactionIds?: number[];
  }>({
    isOpen: false,
    isMultiple: false
  });
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionType, setTransactionType] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [userDetailsDialog, setUserDetailsDialog] = useState<{
    isOpen: boolean;
    userId?: number;
  }>({
    isOpen: false
  });
  
  // Fetch pending transactions
  const { 
    data: pendingTransactionsData, 
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingError
  } = useQuery({
    queryKey: ['pending-transactions', filters],
    queryFn: async () => {
      try {
        return await getPendingTransactions({
          search: filters.search,
          type: filters.type,
          dateRange: filters.dateRange,
          amountRange: filters.amountRange,
          page: filters.page,
          limit: filters.limit,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        });
      } catch (err: any) {
        // Try to parse error response for more helpful message
        if (err instanceof SyntaxError) {
          throw new Error('The server returned invalid JSON. This may indicate a backend error or misconfiguration.');
        }
        if (err && err.message && err.message.includes('Unexpected token')) {
          throw new Error('The server returned a non-JSON response. Check backend logs for errors.');
        }
        throw err;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refetch every minute
  });
  
  // Mutations for approving and rejecting transactions
  const approveMutation = useMutation({
    mutationFn: approveTransaction,
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast({
        title: 'Transaction Approved',
        description: 'The transaction has been successfully approved.',
        variant: 'default' // changed from 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to approve transaction: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  const rejectMutation = useMutation({
    mutationFn: rejectTransaction,
    onSuccess: () => {
      // Close the rejection reason dialog
      setRejectionDialog({ isOpen: false, isMultiple: false });
      setRejectionReason('');
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast({
        title: 'Transaction Rejected',
        description: 'The transaction has been successfully rejected.',
        variant: 'default' // changed from 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to reject transaction: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  // Mutations for bulk operations
  const bulkApproveMutation = useMutation({
    mutationFn: bulkApproveTransactions, // changed to correct function
    onSuccess: (data) => {
      setSelectedTransactions([]);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast({
        title: 'Bulk Approval Complete',
        description: `Successfully approved ${data.processed} transactions. ${data.failed > 0 ? `Failed: ${data.failed}` : ''}`,
        variant: 'default' // changed from 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to bulk approve transactions: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  const bulkRejectMutation = useMutation({
    mutationFn: (params: { transactionIds: number[], rejectionReason: string }) =>
      bulkRejectTransactions(params.transactionIds, params.rejectionReason),
    onSuccess: (data: any) => {
      setSelectedTransactions([]);
      setRejectionDialog({ isOpen: false, isMultiple: false });
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Bulk Rejection Complete',
        description: data && typeof data === 'object' && 'processed' in data
          ? `Successfully rejected ${data.processed} transactions. ${data.failed > 0 ? `Failed: ${data.failed}` : ''}`
          : 'Bulk rejection complete.',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to bulk reject transactions: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  // User details query
  const {
    data: userDetails,
    isLoading: isUserLoading,
    isError: isUserError
  } = useQuery({
    queryKey: ['user-details', userDetailsDialog.userId],
    queryFn: () => getUserDetails(userDetailsDialog.userId || 0),
    enabled: !!userDetailsDialog.userId && userDetailsDialog.isOpen,
    staleTime: 60000 // 1 minute
  });
  
  // Filter transactions by type
  const filteredTransactions = React.useMemo(() => {
    if (!pendingTransactionsData?.transactions) return [];
    
    if (transactionType === 'deposits') {
      return pendingTransactionsData.transactions.filter(t => t.type === 'deposit');
    } else if (transactionType === 'withdrawals') {
      return pendingTransactionsData.transactions.filter(t => t.type === 'withdrawal');
    } else {
      return pendingTransactionsData.transactions;
    }
  }, [pendingTransactionsData, transactionType]);
  
  // Handle approve transaction
  const handleApprove = (transactionId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Transaction',
      description: 'Are you sure you want to approve this transaction? This action cannot be undone.',
      action: () => {
        approveMutation.mutate(transactionId);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // Handle reject transaction
  const handleReject = (transactionId: number) => {
    setRejectionDialog({
      isOpen: true,
      transactionId,
      isMultiple: false
    });
    setRejectionReason('');
  };
  
  // Handle bulk approve
  const handleBulkApprove = () => {
    if (selectedTransactions.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Bulk Approve Transactions',
      description: `Are you sure you want to approve ${selectedTransactions.length} transactions? This action cannot be undone.`,
      action: () => {
        bulkApproveMutation.mutate(selectedTransactions.map(t => Number(t.id)));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // Handle bulk reject
  const handleBulkReject = () => {
    if (selectedTransactions.length === 0) return;
    setRejectionDialog({
      isOpen: true,
      isMultiple: true,
      transactionIds: selectedTransactions.map(t => Number(t.id))
    });
    setRejectionReason('');
  };
  
  // Handle view user details
  const handleViewUserDetails = (userId: number) => {
    setUserDetailsDialog({
      isOpen: true,
      userId
    });
  };
  
  // Submit rejection
  const submitRejection = () => {
    if (rejectionDialog.isMultiple && rejectionDialog.transactionIds) {
      bulkRejectMutation.mutate({
        transactionIds: rejectionDialog.transactionIds,
        rejectionReason: rejectionReason
      });
    } else if (rejectionDialog.transactionId) {
      rejectMutation.mutate({
        transactionId: rejectionDialog.transactionId,
        rejectionReason
      });
    }
  };
  
  // Column definitions for transaction table
  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={
            table.getFilteredSelectedRowModel().rows.length ===
            table.getFilteredRowModel().rows.length
          }
          onChange={(e) => table.toggleAllRowsSelected(e.target.checked)}
          aria-label="Select all"
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => {
            row.toggleSelected(e.target.checked);
            if (e.target.checked) {
              setSelectedTransactions(prev => [...prev, row.original]);
            } else {
              setSelectedTransactions(prev => prev.filter(t => t.id !== row.original.id));
            }
          }}
          aria-label="Select row"
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className={`bg-${getTransactionTypeColor(row.original.type)}-100 text-${getTransactionTypeColor(row.original.type)}-800 border-${getTransactionTypeColor(row.original.type)}-200`}>
          {row.original.type.charAt(0).toUpperCase() + row.original.type.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(Number(row.original.amount))}
        </span>
      ),
    },
    {
      accessorKey: 'userId',
      header: 'User',
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 hover:bg-gray-100"
          onClick={() => handleViewUserDetails(Number(row.original.userId))}
        >
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {row.original.userId.toString().substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="underline">
            User #{row.original.userId}
          </span>
        </Button>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <span>{(row.original as any).method || 'Standard'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.original.createdAt ? formatDate(row.original.createdAt) : 'N/A'}</span>
          <span className="text-xs text-gray-500">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleTimeString() : ''}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
            onClick={() => handleApprove(Number(row.original.id))}
            disabled={approveMutation.isPending}
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
            onClick={() => handleReject(Number(row.original.id))}
            disabled={rejectMutation.isPending}
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transaction Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>
            Approve or reject pending deposits and withdrawals
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by ID, amount or user ID..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <Select
                value={transactionType}
                onValueChange={(value: 'all' | 'deposits' | 'withdrawals') => setTransactionType(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="deposits">Deposits only</SelectItem>
                  <SelectItem value="withdrawals">Withdrawals only</SelectItem>
                </SelectContent>
              </Select>
              
              <DateRangePicker
                onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
                placeholder="Date range"
              />
            </div>
          </div>
          
          {/* Bulk actions */}
          {selectedTransactions.length > 0 && (
            <div className="bg-primary/5 p-3 rounded-md flex items-center justify-between mb-4">
              <span className="text-sm font-medium">
                {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Approve All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                  onClick={handleBulkReject}
                  disabled={bulkRejectMutation.isPending}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Reject All
                </Button>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isPendingLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Error state */}
          {isPendingError && (
            <div className="bg-red-50 p-4 rounded-md text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>Error loading transactions: {pendingError?.message || 'Unknown error'}</span>
            </div>
          )}
          
          {/* Empty state */}
          {!isPendingLoading && !isPendingError && filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No pending transactions</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no pending transactions of the selected type at this time.
              </p>
            </div>
          )}
          
          {/* Data table */}
          {!isPendingLoading && !isPendingError && filteredTransactions.length > 0 && (
            <DataTable
              columns={columns}
              data={filteredTransactions}
              pageCount={pendingTransactionsData?.totalPages || 1}
            />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredTransactions.length} of {pendingTransactionsData?.total || 0} transactions
          </div>
          <Select
            value={String(filters.limit)}
            onValueChange={(value) => setFilters(prev => ({ ...prev, limit: Number(value), page: 1 }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows per page</SelectItem>
              <SelectItem value="25">25 rows per page</SelectItem>
              <SelectItem value="50">50 rows per page</SelectItem>
              <SelectItem value="100">100 rows per page</SelectItem>
            </SelectContent>
          </Select>
        </CardFooter>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button onClick={confirmDialog.action}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog.isOpen} onOpenChange={(open) => setRejectionDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectionDialog.isMultiple ? 'Reject Multiple Transactions' : 'Reject Transaction'}
            </DialogTitle>
            <DialogDescription>
              {rejectionDialog.isMultiple 
                ? `You are about to reject ${rejectionDialog.transactionIds?.length} transactions.`
                : 'Please provide a reason for rejecting this transaction.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Rejection Reason (required)</p>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              {rejectionReason.length < 5 && (
                <p className="text-xs text-red-500">
                  Please provide a rejection reason (minimum 5 characters)
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialog({ isOpen: false, isMultiple: false })}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={submitRejection}
              disabled={rejectionReason.length < 5 || rejectMutation.isPending || bulkRejectMutation.isPending}
            >
              {(rejectMutation.isPending || bulkRejectMutation.isPending) ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* User Details Dialog */}
      <Dialog open={userDetailsDialog.isOpen} onOpenChange={(open) => setUserDetailsDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          
          {isUserLoading && (
            <div className="space-y-4">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          )}
          
          {isUserError && (
            <div className="text-center py-4">
              <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
              <p className="mt-2 text-red-600">Failed to load user details</p>
            </div>
          )}
          
          {!isUserLoading && !isUserError && userDetails && (
            <div className="space-y-4">
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarFallback className="text-lg">
                    {userDetails.firstName?.[0]}{userDetails.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-2 text-lg font-medium">
                  {userDetails.firstName} {userDetails.lastName}
                </h3>
                <p className="text-sm text-gray-500">{userDetails.email}</p>
                
                <div className="flex justify-center mt-2">
                  <Badge 
                    variant={userDetails.isActive ? "default" : "destructive"}
                    className="mx-1"
                  >
                    {userDetails.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  
                  <Badge 
                    variant={userDetails.isVerified ? "default" : "outline"}
                    className="mx-1"
                  >
                    {userDetails.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Available Balance</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(userDetails.balance.available)}
                  </p>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Pending Balance</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(userDetails.balance.pending)}
                  </p>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Total Deposits</p>
                  <p className="text-lg font-semibold">
                    {userDetails.transactions.deposits}
                  </p>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Total Withdrawals</p>
                  <p className="text-lg font-semibold">
                    {userDetails.transactions.withdrawals}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between">
                <p className="text-xs text-gray-500">
                  User ID: {userDetails.id}
                </p>
                <p className="text-xs text-gray-500">
                  Last login: {userDetails.lastLoginAt ? formatDate(userDetails.lastLoginAt) : 'Never'}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setUserDetailsDialog({ isOpen: false })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsManager;
