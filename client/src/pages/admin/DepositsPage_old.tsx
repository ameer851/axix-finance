import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/services/adminService";
import AdminFilters, { FilterState } from "@/components/AdminFilters";
import BulkActions, { createDepositBulkActions } from "@/components/BulkActions";
import { exportDeposits } from "@/utils/exportUtils";

interface Deposit {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  status: "pending" | "completed" | "rejected";
  transactionHash?: string;
  cryptoType?: string;
  walletAddress?: string;
  planName?: string;
  createdAt: string;
  confirmedAt?: string;
}

export default function DepositsPage() {
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deposits with React Query
  const { data: depositsData, isLoading, error } = useQuery({
    queryKey: ['admin-deposits', currentPage, filters],
    queryFn: () => adminService.getDeposits({ page: currentPage, limit: 10, ...filters }),
  });

  const deposits = depositsData?.deposits || [];
  const totalPages = depositsData?.totalPages || 1;
  const totalDeposits = depositsData?.totalDeposits || 0;

  // Mutations for deposit actions
  const updateDepositMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Deposit> }) => 
      adminService.updateDeposit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      toast({
        title: "Success",
        description: "Deposit updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update deposit",
        variant: "destructive",
      });
    },
  });

  const deleteDepositMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      toast({
        title: "Success",
        description: "Deposit deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete deposit",
        variant: "destructive",
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, ids }: { action: string; ids: string[] }) => 
      adminService.bulkAction('deposits', action, ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      setSelectedDeposits([]);
      toast({
        title: "Success",
        description: `${variables.ids.length} deposits ${variables.action}d successfully`,
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

  // Handle individual deposit actions
  const handleApproveDeposit = (id: string) => {
    updateDepositMutation.mutate({ id, data: { status: 'completed' } });
  };

  const handleRejectDeposit = (id: string) => {
    updateDepositMutation.mutate({ id, data: { status: 'rejected' } });
  };

  const handleDeleteDeposit = (id: string) => {
    deleteDepositMutation.mutate(id);
  };

  // Handle bulk actions
  const handleBulkApprove = () => {
    bulkActionMutation.mutate({ action: 'approve', ids: selectedDeposits });
  };

  const handleBulkReject = () => {
    bulkActionMutation.mutate({ action: 'reject', ids: selectedDeposits });
  };

  const handleBulkDelete = () => {
    bulkActionMutation.mutate({ action: 'delete', ids: selectedDeposits });
  };

  // Handle export functionality
  const handleExport = (format: 'csv' | 'pdf') => {
    const exportData = selectedDeposits.length > 0 
      ? deposits.filter(deposit => selectedDeposits.includes(deposit.id))
      : deposits;
    
    exportDeposits(exportData, format);
    
    toast({
      title: "Export Started",
      description: `Exporting ${exportData.length} deposits to ${format.toUpperCase()}...`,
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
        Failed to load deposits. Please try again later.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deposits Management</h1>
        <div className="text-sm text-gray-600">
          Total: {totalDeposits} deposits
        </div>
      </div>

      {/* Filters */}
      <AdminFilters
        onFilterChange={handleFilterChange}
        type="deposits"
        className="mb-6"
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedDeposits}
        onExport={handleExport}
        actions={createDepositBulkActions(
          handleBulkApprove,
          handleBulkReject,
          handleBulkDelete
        )}
        className="mb-4"
      />

      {/* Deposits Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <input
                  type="checkbox"
                  title="Select all deposits"
                  checked={selectedDeposits.length === deposits.length && deposits.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDeposits(deposits.map(d => d.id));
                    } else {
                      setSelectedDeposits([]);
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
            {deposits.map((deposit: Deposit) => (
              <tr key={deposit.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    title={`Select deposit from ${deposit.userName}`}
                    checked={selectedDeposits.includes(deposit.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDeposits([...selectedDeposits, deposit.id]);
                      } else {
                        setSelectedDeposits(selectedDeposits.filter(id => id !== deposit.id));
                      }
                    }}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {deposit.userName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {deposit.userEmail}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    ${deposit.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {deposit.currency}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {deposit.method}
                  </div>
                  {deposit.cryptoType && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {deposit.cryptoType}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    deposit.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : deposit.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {deposit.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(deposit.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {deposit.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveDeposit(deposit.id)}
                        disabled={updateDepositMutation.isPending}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectDeposit(deposit.id)}
                        disabled={updateDepositMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteDeposit(deposit.id)}
                    disabled={deleteDepositMutation.isPending}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Delete
                  </button>
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
