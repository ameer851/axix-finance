import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  RefreshCw,
  Wallet,
} from "lucide-react";
import React, { useState } from "react";

// API Functions
const fetchUserBalance = async (userId: number) => {
  if (!userId) throw new Error("User ID is required");

  try {
    const response = await api.get(`/api/users/${userId}/balance`);

    return {
      availableBalance: Number(response.data.availableBalance) || 0,
      pendingBalance: Number(response.data.pendingBalance) || 0,
      totalBalance:
        Number(response.data.totalBalance) ||
        Number(response.data.availableBalance) ||
        0,
      lastUpdated: response.data.lastUpdated || new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unknown error occurred while fetching balance.";
    throw new Error(message);
  }
};

const submitWithdrawal = async (
  userId: number,
  amount: number,
  method: string,
  address: string
) => {
  const response = await api.post("/api/transactions", {
    userId,
    amount,
    type: "withdrawal",
    description: `Withdrawal of $${amount} via ${method}`,
    cryptoType: method,
    walletAddress: address,
  });

  return response.data;
};

const fetchWithdrawalHistory = async (userId: number) => {
  const response = await api.get(
    `/api/users/${userId}/transactions?type=withdrawal&limit=10`
  );
  return response.data;
};

// Withdrawal Methods
const WITHDRAWAL_METHODS = [
  {
    id: "bitcoin",
    name: "Bitcoin (BTC)",
    icon: "₿",
    minAmount: 50,
    fee: "0.0005 BTC",
    processingTime: "1-3 hours",
  },
  {
    id: "ethereum",
    name: "Ethereum (ETH)",
    icon: "Ξ",
    minAmount: 50,
    fee: "0.01 ETH",
    processingTime: "10-30 minutes",
  },
  {
    id: "usdt",
    name: "USDT (TRC20)",
    icon: "₮",
    minAmount: 50,
    fee: "1 USDT",
    processingTime: "5-15 minutes",
  },
  {
    id: "bnb",
    name: "BNB (BSC)",
    icon: "BNB",
    minAmount: 50,
    fee: "0.001 BNB",
    processingTime: "5-15 minutes",
  },
];

const NewWithdraw: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bitcoin");
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user balance
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["userBalance", user?.id],
    queryFn: () => fetchUserBalance(user?.id as number),
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 3,
  });

  // Fetch withdrawal history
  const { data: withdrawalHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["withdrawalHistory", user?.id],
    queryFn: () => fetchWithdrawalHistory(user?.id as number),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async ({
      amount,
      method,
      address,
    }: {
      amount: number;
      method: string;
      address: string;
    }) => {
      return await submitWithdrawal(
        user?.id as number,
        amount,
        method,
        address
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userBalance", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["withdrawalHistory", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["userTransactions", user?.id],
      });
      toast({
        title: "Withdrawal Submitted",
        description: `Your withdrawal of $${amount} has been submitted for processing.`,
      });
      setAmount("");
      setWalletAddress("");
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description:
          error.message || "There was an error submitting your withdrawal.",
        variant: "destructive",
      });
    },
  });

  // Handle withdrawal submission
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    const selectedMethodData = WITHDRAWAL_METHODS.find(
      (m) => m.id === selectedMethod
    );
    if (Number(amount) < (selectedMethodData?.minAmount || 50)) {
      toast({
        title: "Minimum Amount",
        description: `Minimum withdrawal amount is $${selectedMethodData?.minAmount || 50}.`,
        variant: "destructive",
      });
      return;
    }

    if (Number(amount) > (balance?.availableBalance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You do not have enough balance for this withdrawal.",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress.trim()) {
      toast({
        title: "Wallet Address Required",
        description: "Please enter your wallet address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await withdrawalMutation.mutateAsync({
        amount: Number(amount),
        method: selectedMethod,
        address: walletAddress.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
      },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      rejected: { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
    };

    const style = styles[status as keyof typeof styles] || styles.pending;
    const Icon = style.icon;

    return (
      <Badge className={`${style.bg} ${style.text} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ArrowUpRight className="h-8 w-8 text-red-600" />
          Withdraw Funds
        </h1>
        <p className="text-gray-600 mt-2">
          Request a withdrawal from your account balance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Withdrawal Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Account Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading balance...</span>
                </div>
              ) : balanceError ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Available Balance:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Balance:</span>
                    <span className="text-lg font-semibold text-yellow-600">
                      {formatCurrency(0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Available Balance:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(balance?.availableBalance || 0)}
                    </span>
                  </div>
                  {balance && balance.pendingBalance > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Balance:</span>
                      <span className="text-lg font-semibold text-yellow-600">
                        {formatCurrency(balance.pendingBalance)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WITHDRAWAL_METHODS.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedMethod === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{method.icon}</span>
                      <h3 className="font-semibold">{method.name}</h3>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Min: ${method.minAmount}</div>
                      <div>Fee: {method.fee}</div>
                      <div>Time: {method.processingTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawal} className="space-y-6">
                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter withdrawal amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="50"
                    step="0.01"
                    className="text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum withdrawal: $
                    {WITHDRAWAL_METHODS.find((m) => m.id === selectedMethod)
                      ?.minAmount || 50}
                  </p>
                </div>

                <div>
                  <Label htmlFor="address">
                    {
                      WITHDRAWAL_METHODS.find((m) => m.id === selectedMethod)
                        ?.name
                    }{" "}
                    Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="Enter your wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Double-check your address. Incorrect addresses may result in
                    permanent loss of funds.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important Notice:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Withdrawals are processed within 24 hours</li>
                        <li>
                          • Network fees will be deducted from your withdrawal
                        </li>
                        <li>• Verify your wallet address carefully</li>
                        <li>• Contact support if you need assistance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  disabled={
                    !amount ||
                    !walletAddress ||
                    isSubmitting ||
                    Number(amount) > (balance?.availableBalance || 0)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Request Withdrawal
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Withdrawal History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading history...</p>
                </div>
              ) : withdrawalHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ArrowUpRight className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No withdrawals yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawalHistory
                    .slice(0, 5)
                    .map((withdrawal: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">
                            {formatCurrency(Number(withdrawal.amount))}
                          </span>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Method: {withdrawal.method?.toUpperCase()}</div>
                          <div>
                            Date:{" "}
                            {new Date(
                              withdrawal.createdAt || withdrawal.date
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewWithdraw;
