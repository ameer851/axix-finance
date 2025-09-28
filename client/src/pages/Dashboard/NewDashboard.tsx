import CryptoPriceWidget from "@/components/CryptoPriceWidget";
import DepositThankYou from "@/components/DepositThankYou";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { reinvestFunds } from "@/services/transactionService";
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
        activeDeposits: 0,
        adjustedAvailable: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    const availableBalance = Number((data as any).availableBalance) || 0;
    const adjustedAvailable = Number(
      (data as any).adjustedAvailable ?? (data as any).adjusted_available
    );
    return {
      availableBalance,
      pendingBalance: Number((data as any).pendingBalance) || 0,
      totalBalance:
        Number((data as any).totalBalance) ||
        Number((data as any).availableBalance) ||
        0,
      activeDeposits:
        Number((data as any).activeDeposits ?? (data as any).active_deposits) ||
        0,
      adjustedAvailable: Number.isFinite(adjustedAvailable)
        ? adjustedAvailable
        : availableBalance,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Failed to fetch balance", err);
    return {
      availableBalance: 0,
      pendingBalance: 0,
      totalBalance: 0,
      activeDeposits: 0,
      adjustedAvailable: 0,
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

// Fetch total earned across all investments
const fetchTotalEarned = async (): Promise<number> => {
  try {
    const response: any = await api.get(`/investments/total-earned`);
    const data =
      response && typeof response === "object" && "data" in response
        ? (response as any).data
        : response;
    const val = Number((data as any)?.totalEarned ?? 0);
    return Number.isFinite(val) ? val : 0;
  } catch (error) {
    console.error("Total earned fetch error:", error);
    return 0;
  }
};

// Removed client-side active investments fetch; server now provides adjustedAvailable

// Dashboard Stats Component
const DashboardStats: React.FC<{
  balance: any;
  transactions: any[];
  totalEarned?: number;
  todayReturnSum?: number;
  todayReturnCount?: number;
  expectedPendingSum?: number;
  expectedPendingCount?: number;
  adjustedAvailable?: number;
}> = ({
  balance,
  transactions,
  totalEarned = 0,
  todayReturnSum = 0,
  todayReturnCount = 0,
  expectedPendingSum = 0,
  expectedPendingCount = 0,
  adjustedAvailable,
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
      value: `$${Number(balance?.availableBalance ?? adjustedAvailable ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      description: "Ready to withdraw or reinvest",
    },
    {
      title: "Total Earned",
      value: `$${Number(totalEarned || balance?.totalEarned || 0).toFixed(2)}`,
      icon: BarChart3,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      description: "From active investments (not yet in balance)",
    },
    {
      title: "Active Deposits",
      value: `$${Number(balance?.activeDeposits || 0).toFixed(2)}`,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Principal in active plans",
    },
    {
      title: "Pending Deposits",
      value: `$${pendingDepositAmount.toFixed(2)}`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      description: `${pendingDeposits.length} transaction(s)`,
    },
    {
      title: "Pending Withdrawals",
      value: `$${pendingWithdrawalAmount.toFixed(2)}`,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
      description: `${pendingWithdrawals.length} transaction(s)`,
    },
    {
      title: "Total Deposits",
      value: `$${totalDeposits.toFixed(2)}`,
      icon: ArrowUpRight,
      color: "text-gray-500",
      bg: "bg-gray-50",
      description: "All completed deposits",
    },
    {
      title: "Total Withdrawals",
      value: `$${totalWithdrawals.toFixed(2)}`,
      icon: ArrowDownRight,
      color: "text-gray-500",
      bg: "bg-gray-50",
      description: "All completed withdrawals",
    },
  ];

  const showPendingDiagnostic =
    todayReturnSum === 0 && expectedPendingSum > 0 && expectedPendingCount > 0;

  if (showPendingDiagnostic) {
    stats.push({
      title: "Earnings Pending",
      value: `$${expectedPendingSum.toFixed(2)}`,
      icon: AlertCircle,
      color: "text-amber-700",
      bg: "bg-amber-50",
      description: `${expectedPendingCount} investment(s) awaiting today's accrual run`,
    });
  }

  return (
    <div className="mb-8 space-y-4">
      {showPendingDiagnostic && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">
              Today's earnings are pending processing
            </p>
            <p>
              We estimate{" "}
              <span className="font-medium">
                ${expectedPendingSum.toFixed(2)}
              </span>{" "}
              across {expectedPendingCount} investment
              {expectedPendingCount === 1 ? "" : "s"} will be applied once the
              daily accrual job finishes. This usually completes shortly after
              00:05–00:15 UTC. If this message persists, please refresh or
              contact support.
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
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
  const [reinvestAmount, setReinvestAmount] = useState("");
  const [reinvestLoading, setReinvestLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("STARTER PLAN");

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

  // Fetch total earned
  const {
    data: totalEarned = 0,
    isLoading: totalEarnedLoading,
    refetch: refetchTotalEarned,
  } = useQuery({
    queryKey: ["totalEarned", user?.id],
    queryFn: () => fetchTotalEarned(),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch active investments to adjust available balance (exclude accrued earnings for post-cutoff investments)
  // Removed; adjustedAvailable comes from balance API

  // Fetch today's returns summary (UTC-based, server authoritative)
  const {
    data: todaySummary,
    isLoading: todaySummaryLoading,
    error: todaySummaryError,
    refetch: refetchTodaySummary,
  } = useQuery({
    queryKey: ["todayReturns", user?.id],
    queryFn: async () => {
      try {
        const response: any = await api.get(`/investments/returns/today`);
        const data =
          response && typeof response === "object" && "data" in response
            ? (response as any).data
            : response;
        return {
          sum: Number((data as any)?.sum || 0),
          count: Number((data as any)?.count || 0),
          completionsCount: Number((data as any)?.completionsCount || 0),
          expectedPendingSum: Number((data as any)?.expectedPendingSum || 0),
          expectedPendingCount: Number(
            (data as any)?.expectedPendingCount || 0
          ),
        };
      } catch (e) {
        console.error("Today returns fetch error:", e);
        return { sum: 0, count: 0, completionsCount: 0 };
      }
    },
    enabled: !!user?.id,
    staleTime: 60000,
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
      await Promise.all([
        refetchBalance(),
        refetchTransactions(),
        refetchTotalEarned(),
        refetchTodaySummary(),
      ]);
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
      <DashboardStats
        balance={balance}
        transactions={transactions}
        totalEarned={totalEarned}
        todayReturnSum={todaySummary?.sum || 0}
        todayReturnCount={todaySummary?.count || 0}
        expectedPendingSum={todaySummary?.expectedPendingSum || 0}
        expectedPendingCount={todaySummary?.expectedPendingCount || 0}
        adjustedAvailable={Number(
          (balance as any)?.adjustedAvailable ??
            (balance as any)?.availableBalance ??
            0
        )}
      />

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

      {/* Investment Dashboard removed per request */}

      {/* Reinvest Section */}
      <div className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> Reinvest Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Move available balance into Active Deposits instantly. This locks
              the amount for investment plans. No admin approval required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Reinvest
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={reinvestAmount}
                  onChange={(e) => setReinvestAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Available: $
                  {Number(
                    (balance as any)?.adjustedAvailable ??
                      (balance as any)?.availableBalance ??
                      0
                  ).toFixed(2)}
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Select Investment Plan"
                >
                  <option value="STARTER PLAN">
                    Starter Plan (2% daily, 3 days)
                  </option>
                  <option value="PREMIUM PLAN">
                    Premium Plan (3.5% daily, 7 days)
                  </option>
                  <option value="DELUX PLAN">
                    Delux Plan (5% daily, 10 days)
                  </option>
                  <option value="LUXURY PLAN">
                    Luxury Plan (7.5% daily, 30 days)
                  </option>
                </select>
              </div>
              <Button
                disabled={
                  reinvestLoading ||
                  !reinvestAmount ||
                  Number(reinvestAmount) <= 0 ||
                  (() => {
                    const adjAvail = Number(
                      (balance as any)?.adjustedAvailable ??
                        (balance as any)?.availableBalance ??
                        0
                    );
                    return Number(reinvestAmount) > adjAvail;
                  })()
                }
                onClick={async () => {
                  try {
                    const amt = Number(reinvestAmount);
                    if (!amt || amt <= 0) return;
                    const adjAvail = Number(
                      (balance as any)?.adjustedAvailable ??
                        (balance as any)?.availableBalance ??
                        0
                    );
                    if (amt > adjAvail) {
                      toast({
                        title: "Insufficient Balance",
                        description:
                          "You don't have enough available balance to reinvest that amount.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setReinvestLoading(true);
                    const result: any = await reinvestFunds({
                      amount: amt,
                      planName: selectedPlan,
                    });
                    if (result?.success !== false) {
                      toast({
                        title: "Reinvested",
                        description: `Successfully moved $${amt.toFixed(2)} into Active Deposits.`,
                      });
                      setReinvestAmount("");
                      // Optimistically update cached balance to reflect changes immediately
                      try {
                        queryClient.setQueryData(
                          ["userBalance", user?.id],
                          (prev: any) => {
                            const prevObj =
                              prev && typeof prev === "object" ? prev : {};
                            const nextAvailable = Math.max(
                              0,
                              Number(prevObj.availableBalance || 0) - amt
                            );
                            const nextAdjusted = Math.max(
                              0,
                              Number(
                                prevObj.adjustedAvailable ??
                                  prevObj.availableBalance ??
                                  0
                              ) - amt
                            );
                            const nextActive =
                              Number(prevObj.activeDeposits || 0) + amt;
                            return {
                              ...prevObj,
                              availableBalance: nextAvailable,
                              adjustedAvailable: nextAdjusted,
                              totalBalance: Number(
                                prevObj.totalBalance ||
                                  nextAvailable +
                                    Number(prevObj.pendingBalance || 0)
                              ),
                              activeDeposits: nextActive,
                              lastUpdated: new Date().toISOString(),
                            };
                          }
                        );
                      } catch {}
                      // Invalidate and refetch balance data to confirm server state
                      queryClient.invalidateQueries({
                        queryKey: ["userBalance", user?.id],
                      });
                      const freshBalance = await refetchBalance();
                      console.log(
                        "🔄 Balance after reinvestment:",
                        freshBalance.data
                      );
                      await refetchTransactions();
                    } else {
                      toast({
                        title: "Reinvest Failed",
                        description: result?.message || "Unknown error",
                        variant: "destructive",
                      });
                    }
                  } catch (e: any) {
                    console.error("Reinvest error", e);
                    toast({
                      title: "Reinvest Error",
                      description: e.message || "Failed to reinvest",
                      variant: "destructive",
                    });
                  } finally {
                    setReinvestLoading(false);
                  }
                }}
                className="min-w-[140px]"
              >
                {reinvestLoading ? "Processing..." : "Reinvest"}
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Note: Reinvesting reduces your available balance and increases
              Active Deposits immediately.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Plans List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Investment Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: "Starter Plan",
              rate: "2%",
              duration: "3 days",
              min: "$50",
              color: "blue",
            },
            {
              name: "Premium Plan",
              rate: "3.5%",
              duration: "7 days",
              min: "$1,000",
              color: "green",
            },
            {
              name: "Delux Plan",
              rate: "5%",
              duration: "10 days",
              min: "$5,000",
              color: "purple",
            },
            {
              name: "Luxury Plan",
              rate: "7.5%",
              duration: "30 days",
              min: "$20,000",
              color: "amber",
            },
          ].map((plan, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-semibold text-sm mb-2">{plan.name}</h3>
                  <div
                    className={`text-lg font-bold text-${plan.color}-600 mb-1`}
                  >
                    {plan.rate} Daily
                  </div>
                  <p className="text-xs text-gray-600">{plan.duration}</p>
                  <p className="text-xs text-gray-500 mt-1">Min: {plan.min}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default NewDashboard;
