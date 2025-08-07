import AdminFilters from "@/components/AdminFilters";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminActions, useAdminData } from "@/hooks/use-admin-data";
import { useToast } from "@/hooks/use-toast";
import { adminQueryConfig } from "@/lib/adminQueryConfig";
import { adminService } from "@/services/adminService";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, DollarSign, TrendingDown } from "lucide-react";
import { useCallback, useState } from "react";

interface Withdrawal {
  id: number;
  userId: number;
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
    username: string;
  };
  // Supabase returns related users as an array
  users?: Array<{ id: number; username: string; email: string }>;
  amount: number;
  status: "pending" | "approved" | "rejected" | "processing";
  crypto_type?: string;
  method?: string;
  wallet_address?: string;
  accountDetails?: string;
  transactionId?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

interface ProcessWithdrawalData {
  id: number;
  transactionId: string;
  notes?: string;
}

interface WithdrawalStats {
  total: number;
  pending: number;
  approved: number;
  thisMonth: number;
}

export default function WithdrawalsPage() {
  const { toast } = useToast();
  const [processingWithdrawal, setProcessingWithdrawal] =
    useState<Withdrawal | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");

  const {
    data: withdrawals = [],
    loading,
    currentPage,
    totalPages,
    setPage,
    setFilters,
    refresh,
  } = useAdminData<Withdrawal>({
    endpoint: "/api/admin/withdrawals",
    transform: (data) => data.withdrawals || data,
  });

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminService.getDashboardStats,
    ...adminQueryConfig.mediumFrequency,
  });

  const { executeAction, loading: actionLoading } = useAdminActions(
    "/api/admin/withdrawals",
    {
      onSuccess: () => {
        refresh();
        toast({
          title: "Success",
          description: "Operation completed successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      },
    }
  );

  const handleStatusChange = useCallback(
    async (
      withdrawalId: number,
      status: "approved" | "rejected" | "processing",
      data?: any
    ) => {
      try {
        await executeAction("PUT", `/${withdrawalId}/status`, {
          status,
          ...data,
        });

        if (status === "approved") {
          setProcessingWithdrawal(null);
          setTransactionId("");
          setNotes("");
        }
      } catch (error) {
        console.error(`Failed to ${status} withdrawal:`, error);
      }
    },
    [executeAction]
  );

  const handleProcess = useCallback(
    async (withdrawal: Withdrawal) => {
      if (!transactionId.trim()) {
        toast({
          title: "Error",
          description: "Transaction ID is required",
          variant: "destructive",
        });
        return;
      }

      await handleStatusChange(withdrawal.id, "approved", {
        transactionId: transactionId.trim(),
        notes: notes.trim() || undefined,
      });
    },
    [handleStatusChange, transactionId, notes, toast]
  );

  const handleFilterChange = useCallback(
    (filters: any) => {
      setFilters({
        search: filters.search,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: filters.status === "all" ? undefined : filters.status,
        amountMin: filters.amountMin,
        amountMax: filters.amountMax,
        method: filters.paymentMethod,
      });
    },
    [setFilters]
  );

  const handleBulkAction = useCallback(
    async (action: string, ids: string[]) => {
      try {
        await executeAction("POST", `/bulk/${action}`, {
          withdrawalIds: ids,
        });
      } catch (error) {
        console.error(`Failed to perform bulk ${action}:`, error);
      }
    },
    [executeAction]
  );

  const columns = [
    {
      header: "User",
      accessor: "user",
      cell: (withdrawal: Withdrawal) => {
        const usr =
          Array.isArray((withdrawal as any).users) &&
          (withdrawal as any).users!.length
            ? (withdrawal as any).users![0]
            : undefined;
        return (
          <div>
            <div className="font-medium">
              {usr?.username || `User ${withdrawal.userId}`}
            </div>
            {usr?.email && (
              <div className="text-sm text-gray-500">{usr.email}</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Amount",
      accessor: "amount",
      cell: (withdrawal: Withdrawal) => (
        <span className="font-medium">
          ${withdrawal.amount.toLocaleString()}
        </span>
      ),
    },
    {
      header: "Method",
      accessor: "method",
      cell: (withdrawal: Withdrawal) => (
        <div>
          <div className="capitalize">
            {withdrawal.crypto_type || withdrawal.method || "Bank Transfer"}
          </div>
          {withdrawal.wallet_address && (
            <div className="text-xs text-gray-500 font-mono mt-1">
              {`${withdrawal.wallet_address.substring(0, 10)}...${withdrawal.wallet_address.substring(
                withdrawal.wallet_address.length - 6
              )}`}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (withdrawal: Withdrawal) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          processing: "bg-blue-100 text-blue-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        };

        return (
          <div>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                statusColors[withdrawal.status]
              }`}
            >
              {withdrawal.status.charAt(0).toUpperCase() +
                withdrawal.status.slice(1)}
            </span>
            {withdrawal.transactionId && (
              <div className="text-xs text-gray-500 mt-1">
                TX: {withdrawal.transactionId}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Date",
      accessor: "created_at",
      cell: (withdrawal: Withdrawal) => (
        <span>{new Date(withdrawal.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (withdrawal: Withdrawal) => (
        <div className="space-x-2">
          {withdrawal.status === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-900"
                onClick={() => handleStatusChange(withdrawal.id, "processing")}
                disabled={actionLoading}
              >
                Process
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-900"
                onClick={() => handleStatusChange(withdrawal.id, "rejected")}
                disabled={actionLoading}
              >
                Reject
              </Button>
            </>
          )}
          {withdrawal.status === "processing" && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-900"
              onClick={() => setProcessingWithdrawal(withdrawal)}
              disabled={actionLoading}
            >
              Complete
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-900"
            onClick={() => executeAction("DELETE", `/${withdrawal.id}`)}
            disabled={actionLoading}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Withdrawal Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.withdrawals?.total.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.withdrawals?.pending || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.withdrawals?.approved || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.withdrawals?.thisMonth.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminFilters
        onFilterChange={handleFilterChange}
        filterOptions={{
          showDateRange: true,
          showStatus: true,
          showAmountRange: true,
          showPaymentMethod: true,
          customStatuses: ["pending", "processing", "approved", "rejected"],
          customPaymentMethods: ["Bank Transfer", "Crypto"],
        }}
      />

      <DataTable
        data={withdrawals || []}
        columns={columns}
        loading={loading || actionLoading}
        bulkActions={[
          {
            label: "Approve Selected",
            onClick: (ids) => handleBulkAction("approve", ids),
          },
          {
            label: "Reject Selected",
            onClick: (ids) => handleBulkAction("reject", ids),
          },
          {
            label: "Delete Selected",
            onClick: (ids) => handleBulkAction("delete", ids),
          },
        ]}
        pagination={
          totalPages > 1
            ? {
                currentPage,
                totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      {/* Process Withdrawal Dialog */}
      {processingWithdrawal && (
        <Dialog open={true} onOpenChange={() => setProcessingWithdrawal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Withdrawal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setProcessingWithdrawal(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleProcess(processingWithdrawal)}
                  disabled={!transactionId.trim() || actionLoading}
                >
                  Complete Withdrawal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
