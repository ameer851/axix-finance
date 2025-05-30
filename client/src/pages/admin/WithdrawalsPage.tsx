import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const { toast } = useToast();

  // Fetch withdrawals from API with advanced filtering
  const fetchWithdrawals = async (page = 1, appliedFilters: FilterState = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      });

      // Add filter parameters
      if (appliedFilters.search) params.set('search', appliedFilters.search);
      if (appliedFilters.dateFrom) params.set('dateFrom', appliedFilters.dateFrom);
      if (appliedFilters.dateTo) params.set('dateTo', appliedFilters.dateTo);
      if (appliedFilters.status) params.set('status', appliedFilters.status);
      if (appliedFilters.amountMin) params.set('amountMin', appliedFilters.amountMin.toString());
      if (appliedFilters.amountMax) params.set('amountMax', appliedFilters.amountMax.toString());
      if (appliedFilters.paymentMethod) params.set('method', appliedFilters.paymentMethod);

      const response = await apiRequest("GET", `/api/admin/withdrawals?${params}`);
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
      setTotalWithdrawals(data.totalWithdrawals || 0);
      setSelectedWithdrawals([]); // Clear selection when data changes
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawals. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals(currentPage, filters);
  }, [currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
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

  // Bulk action handlers
  const handleBulkApprove = async (withdrawalIds: string[]) => {
    try {
      const response = await apiRequest("PUT", "/api/admin/withdrawals/bulk-approve", {
        withdrawalIds: withdrawalIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${withdrawalIds.length} withdrawals approved successfully`,
        });
        fetchWithdrawals(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk approve error:", error);
      toast({
        title: "Error",
        description: "Failed to approve withdrawals",
        variant: "destructive"
      });
    }
  };

  const handleBulkReject = async (withdrawalIds: string[]) => {
    try {
      const response = await apiRequest("PUT", "/api/admin/withdrawals/bulk-reject", {
        withdrawalIds: withdrawalIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${withdrawalIds.length} withdrawals rejected successfully`,
        });
        fetchWithdrawals(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk reject error:", error);
      toast({
        title: "Error",
        description: "Failed to reject withdrawals",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async (withdrawalIds: string[]) => {
    try {
      const response = await apiRequest("DELETE", "/api/admin/withdrawals/bulk-delete", {
        withdrawalIds: withdrawalIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${withdrawalIds.length} withdrawals deleted successfully`,
        });
        fetchWithdrawals(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete withdrawals",
        variant: "destructive"
      });
    }
  };
  const handleBulkProcess = async (withdrawalIds: string[]) => {
    try {
      const response = await apiRequest("PUT", "/api/admin/withdrawals/bulk-process", {
        withdrawalIds: withdrawalIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${withdrawalIds.length} withdrawals set to processing successfully`,
        });
        fetchWithdrawals(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk process error:", error);
      toast({
        title: "Error",
        description: "Failed to process withdrawals",
        variant: "destructive"
      });
    }
  };

  const handleBulkComplete = async (withdrawalIds: string[]) => {
    try {
      const response = await apiRequest("PUT", "/api/admin/withdrawals/bulk-complete", {
        withdrawalIds: withdrawalIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${withdrawalIds.length} withdrawals completed successfully`,
        });
        fetchWithdrawals(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk complete error:", error);
      toast({
        title: "Error",
        description: "Failed to complete withdrawals",
        variant: "destructive"
      });
    }
  };

  const handleBulkExport = async (withdrawalIds: string[]) => {
    const exportData = withdrawals.filter(withdrawal => withdrawalIds.includes(withdrawal.id));
    exportWithdrawals(exportData, 'csv');
    
    toast({
      title: "Export Started",
      description: `Exporting ${exportData.length} selected withdrawals...`,
    });
  };

  // Create bulk actions
  const bulkActions = createWithdrawalBulkActions(
    handleBulkApprove,
    handleBulkReject,
    handleBulkProcess,
    handleBulkComplete,
    handleBulkExport
  );

  // Selection handlers
  const handleSelectWithdrawal = (withdrawalId: string) => {
    setSelectedWithdrawals(prev => 
      prev.includes(withdrawalId) 
        ? prev.filter(id => id !== withdrawalId)
        : [...prev, withdrawalId]
    );
  };

  const handleSelectAll = () => {
    if (selectedWithdrawals.length === withdrawals.length) {
      setSelectedWithdrawals([]);
    } else {
      setSelectedWithdrawals(withdrawals.map(withdrawal => withdrawal.id));
    }
  };

  // Calculate selection state for header checkbox
  const isAllSelected = selectedWithdrawals.length === withdrawals.length && withdrawals.length > 0;
  const isIndeterminate = selectedWithdrawals.length > 0 && selectedWithdrawals.length < withdrawals.length;

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      const response = await apiRequest("PUT", `/api/admin/withdrawals/${withdrawalId}/status`, {
        status: 'approved'
      });

      if (response.ok) {
        setWithdrawals(prev => prev.map(withdrawal =>
          withdrawal.id === withdrawalId
            ? { ...withdrawal, status: "approved" as const, processedAt: new Date().toISOString() }
            : withdrawal
        ));
        toast({
          title: "Success",
          description: "Withdrawal approved successfully",
        });
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to approve withdrawal",
        variant: "destructive"
      });
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    const reason = prompt("Please enter a reason for rejection:");
    if (reason) {
      try {
        const response = await apiRequest("PUT", `/api/admin/withdrawals/${withdrawalId}/status`, {
          status: 'rejected',
          reason
        });

        if (response.ok) {
          setWithdrawals(prev => prev.map(withdrawal =>
            withdrawal.id === withdrawalId
              ? { ...withdrawal, status: "rejected" as const }
              : withdrawal
          ));
          toast({
            title: "Success",
            description: "Withdrawal rejected successfully",
          });
        }
      } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        toast({
          title: "Error",
          description: "Failed to reject withdrawal",
          variant: "destructive"
        });
      }
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string) => {
    try {
      const response = await apiRequest("PUT", `/api/admin/withdrawals/${withdrawalId}/status`, {
        status: 'processing'
      });

      if (response.ok) {
        setWithdrawals(prev => prev.map(withdrawal =>
          withdrawal.id === withdrawalId
            ? { ...withdrawal, status: "processing" as const }
            : withdrawal
        ));
        toast({
          title: "Success",
          description: "Withdrawal set to processing",
        });
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to process withdrawal",
        variant: "destructive"
      });
    }
  };

  const handleCompleteWithdrawal = async (withdrawalId: string) => {
    try {
      const response = await apiRequest("PUT", `/api/admin/withdrawals/${withdrawalId}/status`, {
        status: 'completed'
      });

      if (response.ok) {
        setWithdrawals(prev => prev.map(withdrawal =>
          withdrawal.id === withdrawalId
            ? { ...withdrawal, status: "completed" as const, completedAt: new Date().toISOString() }
            : withdrawal
        ));
        toast({
          title: "Success",
          description: "Withdrawal completed successfully",
        });
      }
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to complete withdrawal",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800", 
      processing: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTotalStats = () => {
    const total = withdrawals.reduce((sum, withdrawal) => {
      if (withdrawal.currency === "USD") {
        return sum + withdrawal.amount;
      }
      return sum;
    }, 0);

    const pending = withdrawals.filter(w => w.status === "pending").length;
    const processing = withdrawals.filter(w => w.status === "processing").length;
    const completed = withdrawals.filter(w => w.status === "completed").length;

    return { total, pending, processing, completed };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-300 rounded flex-1"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Withdrawals Management</h1>
        <div className="text-sm text-gray-600">
          Total Withdrawals: {totalWithdrawals}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Withdrawals (USD)</h3>
          <p className="text-3xl font-bold text-blue-600">${stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Processing</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.processing}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdminFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        filterOptions={{
          showDateRange: true,
          showAmountRange: true,
          showStatus: true,
          showPaymentMethod: true,
          showUserSearch: true,
          customStatuses: ['pending', 'approved', 'processing', 'completed', 'rejected']
        }}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedWithdrawals}
        onClearSelection={() => setSelectedWithdrawals([])}
        actions={bulkActions}
        totalItems={withdrawals.length}
      />

      {/* Withdrawals Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  title="Select all withdrawals"
                  aria-label="Select all withdrawals"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Withdrawal ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedWithdrawals.includes(withdrawal.id)}
                    onChange={() => handleSelectWithdrawal(withdrawal.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    title={`Select withdrawal ${withdrawal.id}`}
                    aria-label={`Select withdrawal ${withdrawal.id}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {withdrawal.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{withdrawal.userName}</div>
                    <div className="text-sm text-gray-500">{withdrawal.userEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {withdrawal.amount} {withdrawal.currency}
                  </div>
                  <div className="text-xs text-gray-500">
                    Fee: {withdrawal.fee} | Net: {withdrawal.netAmount}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {withdrawal.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 max-w-32 truncate" title={withdrawal.destination}>
                    {withdrawal.destination}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(withdrawal.status)}`}>
                    {withdrawal.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(withdrawal.requestedAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(withdrawal.requestedAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {withdrawal.status === "pending" && (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectWithdrawal(withdrawal.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {withdrawal.status === "approved" && (
                    <button
                      onClick={() => handleProcessWithdrawal(withdrawal.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Process
                    </button>
                  )}
                  {withdrawal.status === "processing" && (
                    <button
                      onClick={() => handleCompleteWithdrawal(withdrawal.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Complete
                    </button>
                  )}
                  {(withdrawal.status === "completed" || withdrawal.status === "rejected") && (
                    <span className="text-gray-400">
                      {withdrawal.status === "completed" ? "Done" : "Rejected"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {withdrawals.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">No withdrawals found</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
              .map((page, idx, arr) => (
                <span key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'text-white bg-indigo-600'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
