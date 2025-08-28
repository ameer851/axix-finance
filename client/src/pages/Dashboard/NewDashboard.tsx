import CryptoPriceWidget from "@/components/CryptoPriceWidget";
import DepositThankYou from "@/components/DepositThankYou";
import { InvestmentDashboard } from "@/components/InvestmentDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import React, { useState } from "react";

// API Functions with proper error handling
const fetchUserBalance = async (userId: number) => {
  if (!userId) throw new Error("User ID is required");

  try {
    const response: any = await api.get(`/users/${userId}/balance`);
    // Support both flat object and { data: { ... } } shapes
    const data =
      response && typeof response === "object" && "data" in response
        ? response.data
        : response;

    if (!data || typeof data !== "object") {
      console.warn("Balance fetch: unexpected response shape", response);
      return {
        availableBalance: 0,
        pendingBalance: 0,
        totalBalance: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    return {
      availableBalance: Number((data as any).availableBalance) || 0,
      pendingBalance: Number((data as any).pendingBalance) || 0,
      totalBalance:
        Number((data as any).totalBalance) ||
        Number((data as any).availableBalance) ||
        0,
      lastUpdated: (data as any).lastUpdated || new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    // Return zero balance instead of throwing for better UX
    return {
      availableBalance: 0,
      pendingBalance: 0,
      totalBalance: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
};

const fetchUserTransactions = async (userId: number) => {
  if (!userId) throw new Error("User ID is required");

  try {
    const response: any = await api.get(
      `/users/${userId}/transactions?limit=10`
    );
    const data =
      response && typeof response === "object" && "data" in response
        ? response.data
        : response;
    // Normalize to an array regardless of server shape
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).transactions)) {
      return (data as any).transactions;
    }
    return [];
  } catch (error) {
    console.error("Network error fetching transactions:", error);
    return [];
  }
};

// Dashboard Stats Component
const DashboardStats: React.FC<{ balance: any; transactions: any[] }> = ({
  balance,
  transactions,
}) => {
  const completedDeposits =
    transactions?.filter(
      (t) => t.type === "deposit" && t.status === "completed"
    ) || [];
  const completedWithdrawals =
    transactions?.filter(
      (t) => t.type === "withdrawal" && t.status === "completed"
    ) || [];
  const pendingDeposits =
    transactions?.filter(
      (t) => t.type === "deposit" && t.status === "pending"
    ) || [];
  const pendingWithdrawals =
    transactions?.filter(
      (t) => t.type === "withdrawal" && t.status === "pending"
    ) || [];

  const totalDeposits = completedDeposits.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const totalWithdrawals = completedWithdrawals.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const pendingDepositAmount = pendingDeposits.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const pendingWithdrawalAmount = pendingWithdrawals.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const stats = [
    {
      title: "Available Balance",
      value: `$${balance?.availableBalance?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      description: "Ready to withdraw",
    },
    {
      title: "Pending Balance",
      value: `$${balance?.pendingBalance?.toFixed(2) || "0.00"}`,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      description: "Awaiting approval",
    },
    {
      title: "Pending Deposits",
      value: `$${pendingDepositAmount.toFixed(2)}`,
      count: `(${pendingDeposits.length})`,
      icon: ArrowDownRight,
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Waiting for approval",
    },
    {
      title: "Pending Withdrawals",
      value: `$${pendingWithdrawalAmount.toFixed(2)}`,
      count: `(${pendingWithdrawals.length})`,
      icon: ArrowUpRight,
      color: "text-orange-600",
      bg: "bg-orange-50",
      description: "Being processed",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.count && (
                  <p className="text-sm text-gray-500 mt-1">{stat.count}</p>
                )}
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Recent Transactions Component
const RecentTransactions: React.FC<{ transactions: any[] }> = ({
  transactions,
}) => {
  const recentTransactions = transactions?.slice(0, 5) || [];

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getTypeIcon(transaction.type)}
                  <div>
                    <p className="font-medium capitalize">{transaction.type}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(
                        transaction.createdAt || transaction.date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${Number(transaction.amount).toFixed(2)}
                  </p>
                  <Badge className={getStatusBadge(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Account Overview Component
const AccountOverview: React.FC<{ balance: any; transactions: any[] }> = ({
  balance,
  transactions,
}) => {
  const pendingDeposits =
    transactions?.filter(
      (t) => t.type === "deposit" && t.status === "pending"
    ) || [];
  const completedDeposits =
    transactions?.filter(
      (t) => t.type === "deposit" && t.status === "completed"
    ) || [];
  const pendingWithdrawals =
    transactions?.filter(
      (t) => t.type === "withdrawal" && t.status === "pending"
    ) || [];
  const completedWithdrawals =
    transactions?.filter(
      (t) => t.type === "withdrawal" && t.status === "completed"
    ) || [];

  const pendingDepositAmount = pendingDeposits.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const totalDepositAmount = completedDeposits.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const pendingWithdrawalAmount = pendingWithdrawals.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const totalWithdrawalAmount = completedWithdrawals.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  // Calculate progress percentages more accurately
  const maxDepositAmount = Math.max(
    totalDepositAmount,
    pendingDepositAmount,
    1
  );
  const maxWithdrawalAmount = Math.max(
    totalWithdrawalAmount,
    pendingWithdrawalAmount,
    1
  );

  const overviewItems = [
    {
      title: "Pending Deposits",
      amount: pendingDepositAmount,
      count: pendingDeposits.length,
      color: "bg-yellow-500",
      progress:
        totalDepositAmount > 0
          ? (pendingDepositAmount / totalDepositAmount) * 100
          : 0,
    },
    {
      title: "Total Deposits",
      amount: totalDepositAmount,
      count: completedDeposits.length,
      color: "bg-green-500",
      progress: 100, // Always full for total amounts
    },
    {
      title: "Pending Withdrawals",
      amount: pendingWithdrawalAmount,
      count: pendingWithdrawals.length,
      color: "bg-orange-500",
      progress:
        totalWithdrawalAmount > 0
          ? (pendingWithdrawalAmount / totalWithdrawalAmount) * 100
          : 0,
    },
    {
      title: "Total Withdrawals",
      amount: totalWithdrawalAmount,
      count: completedWithdrawals.length,
      color: "bg-blue-500",
      progress: 100, // Always full for total amounts
    },
  ];

  const getProgressWidth = (progress: number) => {
    if (progress >= 100) return "w-full";
    if (progress >= 90) return "w-11/12";
    if (progress >= 75) return "w-3/4";
    if (progress >= 66) return "w-2/3";
    if (progress >= 50) return "w-1/2";
    if (progress >= 33) return "w-1/3";
    if (progress >= 25) return "w-1/4";
    if (progress >= 16) return "w-1/6";
    if (progress >= 8) return "w-1/12";
    if (progress > 0) return "w-1";
    return "w-0";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Account Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {overviewItems.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.title}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    ${item.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.count} transactions
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${item.color} ${getProgressWidth(item.progress)}`}
                ></div>
              </div>
              <div className="text-xs text-gray-500 text-right">
                {item.progress.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Actions Component - REMOVED as requested

// Error Boundary Component
const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <Card className="border-red-200">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 text-red-600 mb-4">
        <AlertCircle className="h-6 w-6" />
        <h3 className="font-semibold">Something went wrong</h3>
      </div>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <Button onClick={resetError} variant="outline">
        Try Again
      </Button>
    </CardContent>
  </Card>
);

// Main Dashboard Component
const NewDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch user balance with proper error handling
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["userBalance", user?.id],
    queryFn: () => fetchUserBalance(user?.id as number),
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (updated from cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle balance error with toast
  React.useEffect(() => {
    if (balanceError) {
      console.error("Balance fetch error:", balanceError);
      toast({
        title: "Error Loading Balance",
        description:
          "Unable to load your account balance. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [balanceError, toast]);

  // Fetch user transactions
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["userTransactions", user?.id],
    queryFn: () => fetchUserTransactions(user?.id as number),
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes (updated from cacheTime)
    retry: 3,
  });

  // Handle transactions error with toast
  React.useEffect(() => {
    if (transactionsError) {
      console.error("Transactions fetch error:", transactionsError);
      toast({
        title: "Error Loading Transactions",
        description:
          "Unable to load your transactions. Some features may be limited.",
        variant: "destructive",
      });
    }
  }, [transactionsError, toast]);

  // Fetch crypto prices - REMOVED since no longer needed

  // Refresh all data
  const handleRefreshAll = async () => {
    try {
      setLastRefresh(new Date());
      await Promise.all([refetchBalance(), refetchTransactions()]);
      toast({
        title: "Data Refreshed",
        description: "All dashboard data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Some data could not be refreshed. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (balanceLoading && transactionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state for critical data
  if (balanceError && transactionsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorFallback
          error={new Error("Unable to load dashboard data")}
          resetError={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || user?.username || "User"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your account today.
          </p>
        </div>
        <Button
          onClick={handleRefreshAll}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Deposit Thank You Message */}
      <DepositThankYou />

      {/* Dashboard Stats */}
      <DashboardStats balance={balance} transactions={transactions} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <AccountOverview balance={balance} transactions={transactions} />
        </div>

        {/* Right Column */}
        <div>
          <CryptoPriceWidget />
        </div>
      </div>

      {/* Investment Dashboard */}
      <div className="mt-8">
        <InvestmentDashboard
          onDepositClick={() => {
            // Navigate to deposit page or open deposit modal
            window.location.href = "/client/deposit";
          }}
        />
      </div>

      {/* Last Updated */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default NewDashboard;
