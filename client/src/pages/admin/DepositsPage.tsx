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
import React, { useState } from "react";
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

export default function DepositsPage() {
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });
  const queryClient = useQueryClient();

  const {
    data: depositsData = {
      deposits: [],
      totalPages: 0,
      currentPage: 1,
      totalDeposits: 0,
    },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-deposits", filters],
    queryFn: async () => {
      // Convert string amounts to numbers for the API
      const apiFilters = {
        ...filters,
        amountMin: filters.amountMin
          ? parseFloat(filters.amountMin)
          : undefined,
        amountMax: filters.amountMax
          ? parseFloat(filters.amountMax)
          : undefined,
      };
      return await adminService.deposits.getAll(apiFilters);
    },
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on specific errors
      if (
        error?.message?.includes("Rate limit exceeded") ||
        error?.message?.includes("429") ||
        error?.message?.includes("Invalid response format") ||
        error?.message?.includes("JSON.parse")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Handle errors with useEffect
  React.useEffect(() => {
    if (error) {
      console.error("Deposits query error:", error);
      let errorMessage = "Failed to fetch deposits. Please try again.";

      if (error?.message?.includes("Rate limit exceeded")) {
        errorMessage = error.message;
      } else if (error?.message?.includes("429")) {
        errorMessage =
          "Too many requests. Please wait a moment before refreshing.";
      } else if (error?.message?.includes("Invalid response format")) {
        errorMessage = "Server returned invalid data. Please refresh the page.";
      } else if (error?.message?.includes("JSON.parse")) {
        errorMessage = "Unable to process server response. Please try again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [error]);

  // Ensure deposits is always an array and extract from the API response structure
  const deposits = Array.isArray(depositsData?.deposits)
    ? depositsData.deposits
    : [];

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminService.getStats,
    ...adminQueryConfig.mediumFrequency,
  });

  const approveMutation = useMutation({
    mutationFn: adminService.approveDeposit,
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
    mutationFn: adminService.rejectDeposit,
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
    mutationFn: adminService.deleteDeposit,
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

  const bulkMutation = useMutation({
    mutationFn: ({
      action,
      depositIds,
    }: {
      action: string;
      depositIds: number[];
    }) => {
      const stringIds = depositIds.map((id) => id.toString());
      switch (action) {
        case "approve":
          return adminService.bulkApproveDeposits(stringIds);
        case "reject":
          return adminService.bulkRejectDeposits(stringIds);
        case "delete":
          return adminService.bulkDeleteDeposits(stringIds);
        default:
          throw new Error("Invalid action");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelectedDeposits([]);
      toast({
        title: "Success",
        description: "Bulk operation completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform bulk operation",
        variant: "destructive",
      });
    },
  });

  const handleBulkAction = (action: string) => {
    if (selectedDeposits.length === 0) {
      toast({
        title: "Error",
        description: "Please select deposits first",
        variant: "destructive",
      });
      return;
    }
    bulkMutation.mutate({
      action,
      depositIds: selectedDeposits.map((id) => parseInt(id)),
    });
  };

  const handleSelectDeposit = (depositId: number) => {
    const depositIdStr = depositId.toString();
    setSelectedDeposits((prev) =>
      prev.includes(depositIdStr)
        ? prev.filter((id) => id !== depositIdStr)
        : [...prev, depositIdStr]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeposits.length === deposits.length) {
      setSelectedDeposits([]);
    } else {
      setSelectedDeposits(deposits.map((d: any) => d.id.toString()));
    }
  };

  const filteredDeposits = deposits.filter((deposit: any) => {
    if (filters.status && deposit.status !== filters.status) return false;
    if (
      filters.dateFrom &&
      new Date(deposit.createdAt) < new Date(filters.dateFrom)
    )
      return false;
    if (
      filters.dateTo &&
      new Date(deposit.createdAt) > new Date(filters.dateTo)
    )
      return false;
    if (filters.amountMin && deposit.amount < parseFloat(filters.amountMin))
      return false;
    if (filters.amountMax && deposit.amount > parseFloat(filters.amountMax))
      return false;
    return true;
  });

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

  if (isLoading) {
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
          setFilters((prev) => ({
            ...prev,
            status: newFilters.status === "all" ? "" : newFilters.status,
            dateFrom: newFilters.dateRange.from
              ? newFilters.dateRange.from.toISOString().split("T")[0]
              : "",
            dateTo: newFilters.dateRange.to
              ? newFilters.dateRange.to.toISOString().split("T")[0]
              : "",
            amountMin: newFilters.amount.min,
            amountMax: newFilters.amount.max,
          }));
        }}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedDeposits}
        onClearSelection={() => setSelectedDeposits([])}
        totalItems={depositsData?.totalDeposits || 0}
        actions={[
          {
            id: "approve",
            label: "Approve Selected",
            icon: <Check className="h-4 w-4" />,
            variant: "success",
            action: async (ids) => {
              await bulkMutation.mutateAsync({
                action: "approve",
                depositIds: ids.map((id) => parseInt(id)),
              });
            },
          },
          {
            id: "reject",
            label: "Reject Selected",
            icon: <X className="h-4 w-4" />,
            variant: "warning",
            action: async (ids) => {
              await bulkMutation.mutateAsync({
                action: "reject",
                depositIds: ids.map((id) => parseInt(id)),
              });
            },
          },
          {
            id: "delete",
            label: "Delete Selected",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "danger",
            action: async (ids) => {
              await bulkMutation.mutateAsync({
                action: "delete",
                depositIds: ids.map((id) => parseInt(id)),
              });
            },
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
                {filteredDeposits.map((deposit: any) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDeposits.includes(
                          deposit.id.toString()
                        )}
                        onChange={() => handleSelectDeposit(deposit.id)}
                        className="rounded border-gray-300"
                        aria-label={`Select deposit ${deposit.id}`}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {deposit.user?.username || `User ${deposit.user_id}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      ${deposit.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deposit.plan_name && (
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
                      )}
                      {!deposit.plan_name && (
                        <span className="text-gray-400">No plan selected</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deposit.daily_profit && deposit.total_return ? (
                        <div className="space-y-1">
                          <div className="text-green-600 font-medium">
                            Total: $
                            {parseFloat(deposit.total_return).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Daily: $
                            {parseFloat(deposit.daily_profit).toLocaleString()}
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
                      {new Date(deposit.created_at).toLocaleDateString()}
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
          {filteredDeposits.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No deposits found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
