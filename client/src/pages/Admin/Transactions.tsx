import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction } from '@shared/schema';
import { formatCurrency, formatDate, getTransactionTypeColor, getStatusColor } from '@/lib/utils';
import { getAllTransactions, approveTransaction, rejectTransaction, getUserById } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  Check,
  X,
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  PieChart,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Transactions: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | null;
    transactionId: number | null;
  }>({ isOpen: false, action: null, transactionId: null });

  // Fetch all transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: getAllTransactions
  });

  // Mutations for transaction approval/rejection
  const approveMutation = useMutation({
    mutationFn: approveTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Transaction approved",
        description: "The transaction has been successfully approved."
      });
      closeConfirmationDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      closeConfirmationDialog();
    }
  });

  const rejectMutation = useMutation({
    mutationFn: rejectTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Transaction rejected",
        description: "The transaction has been rejected."
      });
      closeConfirmationDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      closeConfirmationDialog();
    }
  });

  // Filter transactions based on search and filters
  const filteredTransactions = transactions?.filter(transaction => {
    // Status filter
    if (statusFilter !== 'all' && transaction.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && transaction.type !== typeFilter) {
      return false;
    }

    // Search filter - in a real app, you might want to include user info in the search
    if (searchQuery) {
      return transaction.id.toString().includes(searchQuery) ||
             transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  }) || [];

  // Dialog handlers
  const openDetailsDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const closeDetailsDialog = () => {
    setSelectedTransaction(null);
  };

  const openConfirmationDialog = (action: 'approve' | 'reject', transactionId: number) => {
    setConfirmationDialog({
      isOpen: true,
      action,
      transactionId
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      isOpen: false,
      action: null,
      transactionId: null
    });
    // Reset rejection reason when closing dialog
    setRejectionReason('');
  };

  const confirmAction = () => {
    if (!confirmationDialog.transactionId || !confirmationDialog.action) return;

    if (confirmationDialog.action === 'approve') {
      approveMutation.mutate(confirmationDialog.transactionId);
    } else {
      rejectMutation.mutate({
        transactionId: confirmationDialog.transactionId,
        rejectionReason: rejectionReason || 'Transaction rejected by admin'
      });
    }
    
    // Reset rejection reason after action
    setRejectionReason('');
  };

  // Transaction icon helper
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDown className="h-5 w-5" />;
      case 'withdrawal':
        return <ArrowUp className="h-5 w-5" />;
      case 'transfer':
        return <ArrowLeftRight className="h-5 w-5" />;
      case 'investment':
        return <PieChart className="h-5 w-5" />;
      default:
        return <ArrowLeftRight className="h-5 w-5" />;
    }
  };

  // Table columns
  const transactionColumns = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: (transaction: Transaction) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">#{transaction.id}</div>
      )
    },
    {
      header: 'User',
      accessorKey: 'userId',
      cell: async (transaction: Transaction) => {
        try {
          // In a real implementation, you would use a query hook to fetch this data
          // or ensure it's included in the transaction data from the API
          const user = await getUserById(transaction.userId);
          return (
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {`${user.firstName[0]}${user.lastName[0]}`}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {`${user.firstName} ${user.lastName}`}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  @{user.username}
                </div>
              </div>
            </div>
          );
        } catch (error) {
          return (
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  User #{transaction.userId}
                </div>
              </div>
            </div>
          );
        }
      }
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (transaction: Transaction) => {
        const colors = getTransactionTypeColor(transaction.type);
        return (
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full ${colors.bgClass}`}>
              {getTransactionIcon(transaction.type)}
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {transaction.type}
              </div>
              {transaction.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {transaction.description}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (transaction: Transaction) => {
        const isNegative = transaction.type === 'withdrawal' || transaction.type === 'investment';
        const className = isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
        
        return (
          <div className={`text-sm font-medium ${className}`}>
            {formatCurrency(transaction.amount as string)}
          </div>
        );
      }
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (transaction: Transaction) => {
        const date = new Date(transaction.createdAt);
        return (
          <div>
            <div className="text-sm text-gray-900 dark:text-white">{formatDate(date)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{date.toLocaleTimeString()}</div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (transaction: Transaction) => {
        const { bgClass, textClass } = getStatusColor(transaction.status);
        
        return (
          <Badge variant="outline" className={`${bgClass} ${textClass}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Badge>
        );
      }
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Transaction Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>View and manage all transactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={typeFilter} 
                onValueChange={setTypeFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <DataTable
            columns={transactionColumns}
            data={filteredTransactions}
            loading={isLoading}
            actions={(transaction) => (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openDetailsDialog(transaction)}
                >
                  <Info className="mr-1 h-4 w-4" /> Details
                </Button>
                
                {transaction.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900"
                      onClick={() => openConfirmationDialog('approve', transaction.id)}
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                      onClick={() => openConfirmationDialog('reject', transaction.id)}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && closeDetailsDialog()}>
        {selectedTransaction && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Detailed information about this transaction
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                    {selectedTransaction.type} Transaction
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID: #{selectedTransaction.id}</p>
                </div>
                <div>
                  {selectedTransaction.status === 'completed' && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="mr-1 h-4 w-4" /> Completed
                    </Badge>
                  )}
                  {selectedTransaction.status === 'pending' && (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending
                    </Badge>
                  )}
                  {selectedTransaction.status === 'rejected' && (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      <XCircle className="mr-1 h-4 w-4" /> Rejected
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(selectedTransaction.amount as string)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</p>
                  <p className="mt-1 text-gray-900 dark:text-white">#{selectedTransaction.userId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatDate(selectedTransaction.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{formatDate(selectedTransaction.updatedAt)}</p>
                </div>
              </div>

              {selectedTransaction.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedTransaction.description}</p>
                </div>
              )}
              
              {selectedTransaction.status === 'rejected' && selectedTransaction.rejectionReason && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejection Reason</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedTransaction.rejectionReason}</p>
                </div>
              )}

              {selectedTransaction.status === 'pending' && (
                <div className="flex space-x-2 justify-end mt-4">
                  <Button 
                    variant="outline" 
                    className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900"
                    onClick={() => openConfirmationDialog('approve', selectedTransaction.id)}
                  >
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                    onClick={() => openConfirmationDialog('reject', selectedTransaction.id)}
                  >
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog.isOpen} onOpenChange={(open) => !open && closeConfirmationDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmationDialog.action === 'approve' ? 'Approve Transaction' : 'Reject Transaction'}
            </DialogTitle>
            <DialogDescription>
              {confirmationDialog.action === 'approve' 
                ? 'Are you sure you want to approve this transaction? This will update the user\'s balance.'
                : 'Are you sure you want to reject this transaction? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          {confirmationDialog.action === 'reject' && (
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rejection Reason
              </label>
              <Input
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection"
                className="w-full"
              />
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={closeConfirmationDialog}>
              Cancel
            </Button>
            <Button 
              variant={confirmationDialog.action === 'approve' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {confirmationDialog.action === 'approve' ? (
                <>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-4 w-4" />
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
