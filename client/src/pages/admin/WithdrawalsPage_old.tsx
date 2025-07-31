import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/services/adminService";
import AdminFilters, { FilterState } from "@/components/AdminFilters";
import BulkActions, { createWithdrawalBulkActions } from "@/components/BulkActions";
import { exportWithdrawals } from "@/utils/exportUtils";

interface Withdrawal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  destination: string;
  status: "pending" | "approved" | "processing" | "completed" | "rejected";
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  fee: number;
  netAmount: number;
}

export default function WithdrawalsPage() {
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch withdrawals with React Query
  const { data: withdrawalsData, isLoading, error } = useQuery({
    queryKey: ['admin-withdrawals', currentPage, filters],
    queryFn: () => adminService.getWithdrawals({ page: currentPage, limit: 10, ...filters }),
  });

  const withdrawals = withdrawalsData?.withdrawals || [];
  const totalPages = withdrawalsData?.totalPages || 1;
  const totalWithdrawals = withdrawalsData?.totalWithdrawals || 0;

  // Mutations for withdrawal actions
  const updateWithdrawalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Withdrawal> }) => 
      adminService.updateWithdrawal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      toast({
        title: "Success",
        description: "Withdrawal updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update withdrawal",
        variant: "destructive",
      });
    },
  });

  const deleteWithdrawalMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      toast({
        title: "Success",
        description: "Withdrawal deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete withdrawal",
        variant: "destructive",
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, ids }: { action: string; ids: string[] }) => 
      adminService.bulkAction('withdrawals', action, ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      setSelectedWithdrawals([]);
      toast({
        title: "Success",
        description: `${variables.ids.length} withdrawals ${variables.action}d successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    },
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle individual withdrawal actions
  const handleApproveWithdrawal = (id: string) => {
    updateWithdrawalMutation.mutate({ id, data: { status: 'approved' } });
  };

  const handleRejectWithdrawal = (id: string) => {
    updateWithdrawalMutation.mutate({ id, data: { status: 'rejected' } });
  };

  const handleProcessWithdrawal = (id: string) => {
    updateWithdrawalMutation.mutate({ id, data: { status: 'processing' } });
  };

  const handleCompleteWithdrawal = (id: string) => {
    updateWithdrawalMutation.mutate({ id, data: { status: 'completed' } });
  };

  const handleDeleteWithdrawal = (id: string) => {
    deleteWithdrawalMutation.mutate(id);
  };

  // Handle bulk actions
  const handleBulkApprove = () => {
    bulkActionMutation.mutate({ action: 'approve', ids: selectedWithdrawals });
  };

  const handleBulkReject = () => {
    bulkActionMutation.mutate({ action: 'reject', ids: selectedWithdrawals });
  };

  const handleBulkDelete = () => {
    bulkActionMutation.mutate({ action: 'delete', ids: selectedWithdrawals });
  };

  // Handle export functionality
  const handleExport = (format: 'csv' | 'pdf') => {
    const exportData = selectedWithdrawals.length > 0 
      ? withdrawals.filter(withdrawal => selectedWithdrawals.includes(withdrawal.id))
      : withdrawals;
    
    exportWithdrawals(exportData, format);
    
    toast({
      title: "Export Started",
      description: `Exporting ${exportData.length} withdrawals to ${format.toUpperCase()}...`,
    });
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Failed to load withdrawals. Please try again later.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Withdrawals Management</h1>
        <div className="text-sm text-gray-600">
          Total: {totalWithdrawals} withdrawals
        </div>
      </div>

      {/* Filters */}
      <AdminFilters
        onFilterChange={handleFilterChange}
        type="withdrawals"
        className="mb-6"
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedWithdrawals}
        onExport={handleExport}
        actions={createWithdrawalBulkActions(
          handleBulkApprove,
          handleBulkReject,
          handleBulkDelete
        )}
        className="mb-4"
      />

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <input
                  type="checkbox"
                  title="Select all withdrawals"
                  checked={selectedWithdrawals.length === withdrawals.length && withdrawals.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedWithdrawals(withdrawals.map(w => w.id));
                    } else {
                      setSelectedWithdrawals([]);
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {withdrawals.map((withdrawal: Withdrawal) => (
              <tr key={withdrawal.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    title={`Select withdrawal from ${withdrawal.userName}`}
                    checked={selectedWithdrawals.includes(withdrawal.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWithdrawals([...selectedWithdrawals, withdrawal.id]);
                      } else {
                        setSelectedWithdrawals(selectedWithdrawals.filter(id => id !== withdrawal.id));
                      }
                    }}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {withdrawal.userName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {withdrawal.userEmail}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    ${withdrawal.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Net: ${withdrawal.netAmount.toLocaleString()} (Fee: ${withdrawal.fee})
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {withdrawal.method}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32">
                    {withdrawal.destination}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(withdrawal.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-1">
                    {withdrawal.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveWithdrawal(withdrawal.id)}
                          disabled={updateWithdrawalMutation.isPending}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectWithdrawal(withdrawal.id)}
                          disabled={updateWithdrawalMutation.isPending}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {withdrawal.status === 'approved' && (
                      <button
                        onClick={() => handleProcessWithdrawal(withdrawal.id)}
                        disabled={updateWithdrawalMutation.isPending}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-xs"
                      >
                        Process
                      </button>
                    )}
                    {withdrawal.status === 'processing' && (
                      <button
                        onClick={() => handleCompleteWithdrawal(withdrawal.id)}
                        disabled={updateWithdrawalMutation.isPending}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 text-xs"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteWithdrawal(withdrawal.id)}
                      disabled={deleteWithdrawalMutation.isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
