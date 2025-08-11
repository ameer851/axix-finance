import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  PieChart,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

// API Functions
const fetchPortfolioData = async (userId: number) => {
  if (!userId) throw new Error("User ID is required");

  try {
    const response = await fetch(`/api/users/${userId}/portfolio`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio: ${response.status}`);
    }

    const data = await response.json();
    return {
      totalValue: Number(data.totalValue) || 0,
      totalInvested: Number(data.totalInvested) || 0,
      totalProfit: Number(data.totalProfit) || 0,
      profitPercentage: Number(data.profitPercentage) || 0,
      investments: data.investments || [],
      recentTransactions: data.recentTransactions || [],
      performanceData: data.performanceData || [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Portfolio fetch error:", error);
    // Return fallback data instead of throwing
    return {
      totalValue: 0,
      totalInvested: 0,
      totalProfit: 0,
      profitPercentage: 0,
      investments: [],
      recentTransactions: [],
      performanceData: [],
      lastUpdated: new Date().toISOString(),
    };
  }
};

const fetchInvestmentHistory = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}/investments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch investment history");
    }

    return response.json();
  } catch (error) {
    console.error("Investment history fetch error:", error);
    return [];
  }
};

const NewPortfolio: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch portfolio data
  const {
    data: portfolio,
    isLoading: portfolioLoading,
    error: portfolioError,
    refetch: refetchPortfolio,
  } = useQuery({
    queryKey: ["portfolio", user?.id],
    queryFn: () => fetchPortfolioData(user?.id as number),
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 3,
  });

  // Fetch investment history
  const { data: investments = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ["investments", user?.id],
    queryFn: () => fetchInvestmentHistory(user?.id as number),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      active: { bg: "bg-green-100", text: "text-green-800" },
      completed: { bg: "bg-blue-100", text: "text-blue-800" },
      cancelled: { bg: "bg-red-100", text: "text-red-800" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    };

    const style =
      styles[status?.toLowerCase() as keyof typeof styles] || styles.pending;

    return (
      <Badge className={`${style.bg} ${style.text} border-0 text-xs`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  // Get profit color
  const getProfitColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  // Portfolio stats for overview
  const portfolioStats = [
    {
      title: "Total Value",
      value: formatCurrency(portfolio?.totalValue || 0),
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: "Total Invested",
      value: formatCurrency(portfolio?.totalInvested || 0),
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Total Profit",
      value: formatCurrency(portfolio?.totalProfit || 0),
      icon: ArrowUpRight,
      color: getProfitColor(portfolio?.totalProfit || 0),
    },
    {
      title: "Profit Percentage",
      value: formatPercentage(portfolio?.profitPercentage || 0),
      icon: Target,
      color: getProfitColor(portfolio?.profitPercentage || 0),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <PieChart className="h-8 w-8 text-purple-600" />
          Portfolio
        </h1>
        <p className="text-gray-600 mt-2">
          Track your investments and portfolio performance.
        </p>
      </div>

      {/* Portfolio Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {portfolioStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {portfolioLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investments">Active Investments</TabsTrigger>
          <TabsTrigger value="history">Investment History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {portfolioError ? (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Unable to load portfolio data
                </h3>
                <p className="text-gray-500 mb-4">
                  There was an error loading your portfolio information.
                </p>
                <Button onClick={() => refetchPortfolio()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Portfolio Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Performance chart will be displayed here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolioLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Loading activities...
                      </p>
                    </div>
                  ) : portfolio?.recentTransactions?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent activities</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {portfolio?.recentTransactions
                        ?.slice(0, 5)
                        .map((transaction: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {transaction.type === "deposit" ? (
                                <ArrowDownRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                              )}
                              <div>
                                <p className="font-medium capitalize">
                                  {transaction.type}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(
                                    transaction.date || transaction.createdAt
                                  )}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`font-semibold ${
                                transaction.type === "deposit"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "deposit" ? "+" : "-"}
                              {formatCurrency(Number(transaction.amount))}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Active Investments Tab */}
        <TabsContent value="investments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Active Investments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading active investments...</p>
                </div>
              ) : portfolio?.investments?.length === 0 ? (
                <div className="text-center py-12">
                  <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Investments
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start investing to see your portfolio grow.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/client/deposit")}
                  >
                    Start Investing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio?.investments?.map(
                    (investment: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {investment.planName ||
                                investment.name ||
                                "Investment Plan"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Started:{" "}
                              {formatDate(
                                investment.startDate || investment.createdAt
                              )}
                            </p>
                          </div>
                          {getStatusBadge(investment.status || "active")}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">
                              Invested Amount
                            </p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(Number(investment.amount))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Current Value
                            </p>
                            <p className="font-semibold">
                              {formatCurrency(
                                Number(investment.currentValue) ||
                                  Number(investment.amount)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Profit/Loss</p>
                            <p
                              className={`font-semibold ${getProfitColor(Number(investment.profit) || 0)}`}
                            >
                              {formatCurrency(Number(investment.profit) || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">ROI</p>
                            <p
                              className={`font-semibold ${getProfitColor(Number(investment.roi) || 0)}`}
                            >
                              {formatPercentage(Number(investment.roi) || 0)}
                            </p>
                          </div>
                        </div>

                        {investment.maturityDate && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                              Matures on: {formatDate(investment.maturityDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investment History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Investment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investmentsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading investment history...</p>
                </div>
              ) : investments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Investment History
                  </h3>
                  <p className="text-gray-500">
                    Your investment history will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {investments.map((investment: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">
                            {investment.planName || "Investment Plan"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(
                              investment.createdAt || investment.date
                            )}
                          </p>
                        </div>
                        {getStatusBadge(investment.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="font-semibold">
                            {formatCurrency(Number(investment.amount))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-semibold">
                            {investment.duration || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Expected Return
                          </p>
                          <p className="font-semibold text-green-600">
                            {investment.expectedReturn
                              ? formatPercentage(
                                  Number(investment.expectedReturn)
                                )
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewPortfolio;
