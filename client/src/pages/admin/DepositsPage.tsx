import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  status: "pending" | "confirmed" | "failed";
  transactionHash?: string;
  createdAt: string;
  confirmedAt?: string;
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const { toast } = useToast();  // Fetch deposits from API with advanced filtering
  const fetchDeposits = async (page = 1, appliedFilters: FilterState = {}) => {
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

      const response = await apiRequest("GET", `/api/admin/deposits?${params}`);
      const data = await response.json();
      setDeposits(data.deposits || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
      setTotalDeposits(data.totalDeposits || 0);
      setSelectedDeposits([]); // Clear selection when data changes
    } catch (error) {
      console.error("Failed to fetch deposits:", error);
      toast({
        title: "Error",
        description: "Failed to fetch deposits. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits(currentPage, filters);
  }, [currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
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
  // Bulk action handlers
  const handleBulkApprove = async (depositIds: string[]) => {
    try {
      const response = await apiRequest("PUT", "/api/admin/deposits/bulk-approve", {
        depositIds: depositIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${depositIds.length} deposits approved successfully`,
        });
        fetchDeposits(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk approve error:", error);
      toast({
        title: "Error",
        description: "Failed to approve deposits",
        variant: "destructive"
      });
    }
  };

  const handleBulkReject = async (depositIds: string[]) => {
    try {
      const response = await apiRequest("PUT", "/api/admin/deposits/bulk-reject", {
        depositIds: depositIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${depositIds.length} deposits rejected successfully`,
        });
        fetchDeposits(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk reject error:", error);
      toast({
        title: "Error",
        description: "Failed to reject deposits",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async (depositIds: string[]) => {
    try {
      const response = await apiRequest("DELETE", "/api/admin/deposits/bulk-delete", {
        depositIds: depositIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${depositIds.length} deposits deleted successfully`,
        });
        fetchDeposits(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete deposits",
        variant: "destructive"
      });
    }
  };

  const handleBulkExport = async (depositIds: string[]) => {
    const exportData = deposits.filter(deposit => depositIds.includes(deposit.id));
    exportDeposits(exportData, 'csv');
    
    toast({
      title: "Export Started",
      description: `Exporting ${exportData.length} selected deposits...`,
    });
  };

  // Create bulk actions
  const bulkActions = createDepositBulkActions(
    handleBulkApprove,
    handleBulkReject,
    handleBulkDelete,
    handleBulkExport
  );

  // Selection handlers
  const handleSelectDeposit = (depositId: string) => {
    setSelectedDeposits(prev => 
      prev.includes(depositId) 
        ? prev.filter(id => id !== depositId)
        : [...prev, depositId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeposits.length === deposits.length) {
      setSelectedDeposits([]);
    } else {
      setSelectedDeposits(deposits.map(deposit => deposit.id));
    }
  };

  // Calculate selection state for header checkbox
  const isAllSelected = selectedDeposits.length === deposits.length && deposits.length > 0;
  const isIndeterminate = selectedDeposits.length > 0 && selectedDeposits.length < deposits.length;  const handleApproveDeposit = async (depositId: string) => {
    try {
      const response = await apiRequest("PUT", `/api/admin/deposits/${depositId}/status`, {
        status: 'confirmed'
      });

      if (response.ok) {
        setDeposits(prev => prev.map(deposit =>
          deposit.id === depositId
            ? { ...deposit, status: "confirmed" as const, confirmedAt: new Date().toISOString() }
            : deposit
        ));
        toast({
          title: "Success",
          description: "Deposit approved successfully",
        });
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast({
        title: "Error",
        description: "Failed to approve deposit",
        variant: "destructive"
      });
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    if (confirm("Are you sure you want to reject this deposit?")) {
      try {
        const response = await apiRequest("PUT", `/api/admin/deposits/${depositId}/status`, {
          status: 'failed'
        });

        if (response.ok) {
          setDeposits(prev => prev.map(deposit =>
            deposit.id === depositId
              ? { ...deposit, status: "failed" as const }
              : deposit
          ));
          toast({
            title: "Success",
            description: "Deposit rejected successfully",
          });
        }
      } catch (error) {
        console.error('Error rejecting deposit:', error);
        toast({
          title: "Error",
          description: "Failed to reject deposit",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };
  const getTotalStats = () => {
    const total = deposits.reduce((sum, deposit) => {
      if (deposit.currency === "USD") {
        return sum + deposit.amount;
      }
      // For crypto, you'd need conversion rates
      return sum;
    }, 0);

    const pending = deposits.filter(d => d.status === "pending").length;
    const confirmed = deposits.filter(d => d.status === "confirmed").length;

    return { total, pending, confirmed };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
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
        <h1 className="text-3xl font-bold text-gray-900">Deposits Management</h1>
        <div className="text-sm text-gray-600">
          Total Deposits: {totalDeposits}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Deposits (USD)</h3>
          <p className="text-3xl font-bold text-blue-600">${stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Confirmed Today</h3>
          <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
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
          customStatuses: ['pending', 'confirmed', 'failed']
        }}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedDeposits}
        onClearSelection={() => setSelectedDeposits([])}
        actions={bulkActions}
        totalItems={deposits.length}
      />

      {/* Deposits Table */}
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
                  title="Select all deposits"
                  aria-label="Select all deposits"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deposit ID
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
            {deposits.map((deposit) => (
              <tr key={deposit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedDeposits.includes(deposit.id)}
                    onChange={() => handleSelectDeposit(deposit.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    title={`Select deposit ${deposit.id}`}
                    aria-label={`Select deposit ${deposit.id}`}
                  />
                </td>                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {deposit.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{deposit.userName}</div>
                    <div className="text-sm text-gray-500">{deposit.userEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {deposit.amount} {deposit.currency}
                  </div>
                  {deposit.transactionHash && (
                    <div className="text-xs text-gray-500 font-mono">
                      {deposit.transactionHash.substring(0, 20)}...
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deposit.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(deposit.status)}`}>
                    {deposit.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(deposit.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(deposit.createdAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {deposit.status === "pending" && (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleApproveDeposit(deposit.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectDeposit(deposit.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {deposit.status !== "pending" && (
                    <span className="text-gray-400">
                      {deposit.status === "confirmed" ? "Approved" : "Rejected"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {deposits.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">No deposits found</div>
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
