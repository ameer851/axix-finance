import { useAdminActions, useAdminData } from "@/hooks/use-admin-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Trash2,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import BulkActions from "../../components/BulkActions";
import TransactionFilter from "../../components/TransactionFilter";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { toast } from "../../hooks/use-toast";
import { adminQueryConfig } from "../../lib/adminQueryConfig";
import { adminService } from "../../services/adminService";
// Minimal deposit type, only guaranteed fields
interface MinimalDeposit {
  id: string;
  user: string;
  amount: number;
  plan?: string | null;
  createdAt: string;
  status: string;
  users?: Array<{ username: string }>; // for user display
  plan_name?: string | null;
  plan_duration?: string | null;
  daily_profit?: string | null;
  total_return?: string | null;
  crypto_type?: string | null;
  method?: string | null;
  description?: string | null;
  created_at?: string | null;
}

// Guard/mapper for API responses
function toMinimalDeposit(raw: any): MinimalDeposit {
  if (!raw || typeof raw !== "object")
    throw new Error("Invalid deposit object from API");
  if (
    !raw.id ||
    !raw.user ||
    !raw.amount ||
    !raw.status ||
    (!raw.createdAt && !raw.created_at)
  )
    throw new Error("Deposit object missing required fields");
  return {
    id: String(raw.id),
    user: String(raw.user),
    amount: Number(raw.amount),
    plan: raw.plan ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? "",
    status: raw.status,
    users: Array.isArray(raw.users) ? raw.users : undefined,
    plan_name: raw.plan_name ?? null,
    plan_duration: raw.plan_duration ?? null,
    daily_profit: raw.daily_profit ?? null,
    total_return: raw.total_return ?? null,
    crypto_type: raw.crypto_type ?? null,
    method: raw.method ?? null,
    description: raw.description ?? null,
    created_at: raw.created_at ?? null,
  };
}

export default function DepositsPage() {
  const queryClient = useQueryClient();

  // Use hook to fetch deposits
  const {
    data: deposits = [],
    loading,
    currentPage,
    totalPages,
    totalItems,
    setPage,
    setFilters,
    refresh,
  } = useAdminData<MinimalDeposit>({
    endpoint: "/api/admin/deposits",
    transform: (res) =>
      Array.isArray(res.data) ? res.data.map(toMinimalDeposit) : [],
  });

  // Use hook for approve/reject actions
  const { executeAction, loading: actionLoading } = useAdminActions(
    "/api/admin/deposits",
    { onSuccess: refresh }
  );

  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: errorStats,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminService.getDashboardStats,
    ...adminQueryConfig.mediumFrequency,
  });

  const approveMutation = useMutation({
    mutationFn: adminService.deposits.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Success", description: "Deposit approved successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve deposit",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: adminService.deposits.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Success", description: "Deposit rejected successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject deposit",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deposits.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Success", description: "Deposit deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete deposit",
        variant: "destructive",
      });
    },
  });

  // If you want to support bulk actions, implement them here or in adminService

  const handleBulkAction = async (action: string) => {
    if (selectedDeposits.length === 0) {
      toast({
        title: "Error",
        description: "Please select deposits first",
        variant: "destructive",
      });
      return;
    }
    await executeAction("POST", `/bulk/${action}`, {
      depositIds: selectedDeposits,
    });
  };

  const handleSelectDeposit = (depositId: string) => {
    setSelectedDeposits((prev) =>
      prev.includes(depositId)
        ? prev.filter((id) => id !== depositId)
        : [...prev, depositId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeposits.length === deposits.length) {
      setSelectedDeposits([]);
    } else {
      setSelectedDeposits(deposits.map((d) => d.id.toString()));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Deposit Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Deposits
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.deposits?.total?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.deposits?.pending || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.deposits?.approved || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.deposits?.thisMonth?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TransactionFilter
        onFilter={(newFilters) => {
          setFilters({
            status: newFilters.status === "all" ? undefined : newFilters.status,
            dateFrom: newFilters.dateRange.from
              ? newFilters.dateRange.from.toISOString().split("T")[0]
              : undefined,
            dateTo: newFilters.dateRange.to
              ? newFilters.dateRange.to.toISOString().split("T")[0]
              : undefined,
            amountMin: newFilters.amount.min,
            amountMax: newFilters.amount.max,
          });
          setPage(1);
        }}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedDeposits}
        onClearSelection={() => setSelectedDeposits([])}
        totalItems={totalItems || 0}
        actions={[
          {
            id: "approve",
            label: "Approve Selected",
            icon: <Check className="h-4 w-4" />,
            variant: "success",
            action: async (ids) => handleBulkAction("approve"),
          },
          {
            id: "reject",
            label: "Reject Selected",
            icon: <X className="h-4 w-4" />,
            variant: "warning",
            action: async (ids) => handleBulkAction("reject"),
          },
          {
            id: "delete",
            label: "Delete Selected",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "danger",
            action: async (ids) => handleBulkAction("delete"),
          },
        ]}
      />

      {/* Deposits Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedDeposits.length === deposits.length &&
                        deposits.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                      aria-label="Select all deposits"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Expected Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deposits.map((deposit: MinimalDeposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDeposits.includes(deposit.id)}
                        onChange={() => handleSelectDeposit(deposit.id)}
                        className="rounded border-gray-300"
                        aria-label={"Select deposit " + deposit.id}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {Array.isArray(deposit.users) && deposit.users.length > 0
                        ? deposit.users[0].username
                        : `User ${deposit.user}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {"$" + deposit.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deposit.plan_name ? (
                        <div className="space-y-1">
                          <div className="font-medium text-blue-600">
                            {deposit.plan_name}
                          </div>
                          {deposit.plan_duration && (
                            <div className="text-xs text-gray-500">
                              Duration: {deposit.plan_duration}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No plan selected</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deposit.daily_profit && deposit.total_return ? (
                        <div className="space-y-1">
                          <div className="text-green-600 font-medium">
                            {"Total: $" +
                              parseFloat(deposit.total_return).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {"Daily: $" +
                              parseFloat(deposit.daily_profit).toLocaleString()}
                          </div>
                        </div>
                      ) : deposit.plan_name ? (
                        <div className="text-sm text-gray-500">
                          <div>Plan: {deposit.plan_name}</div>
                          {deposit.description &&
                            deposit.description.includes("Daily Profit:") && (
                              <div className="text-xs">
                                {deposit.description
                                  .split(" - ")
                                  .slice(1)
                                  .join(" - ")}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not calculated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deposit.crypto_type ||
                        deposit.method ||
                        "Account Balance"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(deposit.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(
                        deposit.created_at ?? deposit.createdAt
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {deposit.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(deposit.id)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => rejectMutation.mutate(deposit.id)}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(deposit.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {deposits.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No deposits found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
