import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Trash2,
  TrendingDown,
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
import { adminService } from "../../services/adminService";

export default function WithdrawalsPage() {
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: "pending", // Default to showing pending withdrawals
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });
  const queryClient = useQueryClient();

  const {
    data: withdrawalsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-withdrawals", filters],
    queryFn: async () => {
      try {
        // Create a fake withdrawal for testing if needed
        // This is just for demonstration - remove in production
        try {
          const testWithdrawal = await adminService.createTestWithdrawal();
          console.log("Created test withdrawal:", testWithdrawal);
        } catch (testErr) {
          console.warn("Failed to create test withdrawal:", testErr);
        }

        const result = await adminService.withdrawals.getAll({
          ...filters,
        });
        console.log("Withdrawal API response:", result);
        return result;
      } catch (err) {
        console.error("Error fetching withdrawals:", err);
        throw err;
      }
    },
  });

  // Extract withdrawals array from the response object, handling all possible structures
  // Extract and process withdrawals from the API response
  const withdrawals = React.useMemo(() => {
    console.log("Processing withdrawals response:", withdrawalsResponse);

    if (!withdrawalsResponse) return [];

    // If it's directly an array
    if (Array.isArray(withdrawalsResponse)) {
      console.log("Direct array of withdrawals:", withdrawalsResponse.length);
      return withdrawalsResponse;
    }

    // If it has a withdrawals property (most likely scenario)
    if (
      withdrawalsResponse.withdrawals &&
      Array.isArray(withdrawalsResponse.withdrawals)
    ) {
      console.log(
        "Found withdrawals property:",
        withdrawalsResponse.withdrawals.length
      );
      return withdrawalsResponse.withdrawals;
    }

    // Try to find any array property that might contain our withdrawals
    const arrayProps = Object.entries(withdrawalsResponse).find(
      ([key, value]) =>
        Array.isArray(value) &&
        (key === "data" ||
          key === "withdrawals" ||
          key === "transactions" ||
          key === "results")
    );

    if (arrayProps) {
      console.log(
        `Found array in property ${arrayProps[0]}:`,
        arrayProps[1].length
      );
      return arrayProps[1];
    }

    // Last resort: look for any array
    const anyArray = Object.values(withdrawalsResponse).find((v) =>
      Array.isArray(v)
    );
    if (anyArray) {
      console.log("Found some array property:", anyArray.length);
      return anyArray;
    }

    console.warn(
      "Could not find withdrawals in API response:",
      withdrawalsResponse
    );
    return [];
  }, [withdrawalsResponse]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminService.getDashboardStats,
  });

  const approveMutation = useMutation({
    mutationFn: adminService.withdrawals.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "Success",
        description: "Withdrawal approved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve withdrawal",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: adminService.rejectWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "Success",
        description: "Withdrawal rejected successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject withdrawal",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
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

  const bulkMutation = useMutation({
    mutationFn: ({
      action,
      withdrawalIds,
    }: {
      action: string;
      withdrawalIds: number[];
    }) => {
      const stringIds = withdrawalIds.map((id) => id.toString());
      switch (action) {
        case "approve":
          return adminService.bulkApproveWithdrawals(stringIds);
        case "reject":
          return adminService.bulkRejectWithdrawals(stringIds);
        case "delete":
          return adminService.bulkDeleteWithdrawals(stringIds);
        default:
          throw new Error("Invalid action");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelectedWithdrawals([]);
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
    if (selectedWithdrawals.length === 0) {
      toast({
        title: "Error",
        description: "Please select withdrawals first",
        variant: "destructive",
      });
      return;
    }
    bulkMutation.mutate({
      action,
      withdrawalIds: selectedWithdrawals.map((id) => parseInt(id)),
    });
  };

  const handleSelectWithdrawal = (withdrawalId: number) => {
    const withdrawalIdStr = withdrawalId.toString();
    setSelectedWithdrawals((prev) =>
      prev.includes(withdrawalIdStr)
        ? prev.filter((id) => id !== withdrawalIdStr)
        : [...prev, withdrawalIdStr]
    );
  };

  const handleSelectAll = () => {
    if (selectedWithdrawals.length === withdrawals.length) {
      setSelectedWithdrawals([]);
    } else {
      setSelectedWithdrawals(withdrawals.map((w: any) => w.id.toString()));
    }
  };

  const filteredWithdrawals = withdrawals.filter((withdrawal: any) => {
    if (filters.status && withdrawal.status !== filters.status) return false;
    if (
      filters.dateFrom &&
      new Date(withdrawal.created_at) < new Date(filters.dateFrom)
    )
      return false;
    if (
      filters.dateTo &&
      new Date(withdrawal.created_at) > new Date(filters.dateTo)
    )
      return false;
    if (filters.amountMin && withdrawal.amount < parseFloat(filters.amountMin))
      return false;
    if (filters.amountMax && withdrawal.amount > parseFloat(filters.amountMax))
      return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-red-500">
          Error Loading Withdrawals
        </h2>
        <p className="text-gray-600">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <pre className="bg-gray-100 p-4 rounded text-sm max-w-2xl overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Withdrawal Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Withdrawals
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.withdrawals?.total?.toLocaleString() || "0"}
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
              {stats?.withdrawals?.pending || 0}
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
              {stats?.withdrawals?.approved || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.withdrawals?.thisMonth?.toLocaleString() || "0"}
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
        selectedItems={selectedWithdrawals}
        onClearSelection={() => setSelectedWithdrawals([])}
        totalItems={withdrawals.length}
        actions={[
          {
            id: "approve",
            label: "Approve Selected",
            icon: <Check className="h-4 w-4" />,
            variant: "success",
            action: async (ids) => {
              await bulkMutation.mutateAsync({
                action: "approve",
                withdrawalIds: ids.map((id) => parseInt(id)),
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
                withdrawalIds: ids.map((id) => parseInt(id)),
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
                withdrawalIds: ids.map((id) => parseInt(id)),
              });
            },
          },
        ]}
      />

      {/* Withdrawals Table */}
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
                        selectedWithdrawals.length === withdrawals.length &&
                        withdrawals.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                      aria-label="Select all withdrawals"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Wallet
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
                {filteredWithdrawals.map((withdrawal: any) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedWithdrawals.includes(
                          withdrawal.id.toString()
                        )}
                        onChange={() => handleSelectWithdrawal(withdrawal.id)}
                        className="rounded border-gray-300"
                        aria-label={`Select withdrawal ${withdrawal.id}`}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {withdrawal.user?.username ||
                        `User ${withdrawal.user_id}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      ${withdrawal.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {withdrawal.crypto_type ||
                        withdrawal.method ||
                        "Bank Transfer"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                      {withdrawal.wallet_address
                        ? `${withdrawal.wallet_address.substring(0, 10)}...${withdrawal.wallet_address.substring(withdrawal.wallet_address.length - 6)}`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {withdrawal.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              approveMutation.mutate(withdrawal.id)
                            }
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => rejectMutation.mutate(withdrawal.id)}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(withdrawal.id)}
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
          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No withdrawals found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
