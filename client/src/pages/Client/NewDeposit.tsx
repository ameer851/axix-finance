import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DepositConfirmationModal from '@/components/DepositConfirmationModal';
import { 
  ArrowDownRight, 
  DollarSign, 
  Wallet, 
  CreditCard,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

// API Functions
const fetchUserBalance = async (userId: number) => {
  if (!userId) throw new Error('User ID is required');
  
  try {
    const response = await fetch(`/api/users/${userId}/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.status}`);
    }

    const data = await response.json();
    return {
      availableBalance: Number(data.availableBalance) || 0,
      pendingBalance: Number(data.pendingBalance) || 0,
      totalBalance: Number(data.totalBalance) || Number(data.availableBalance) || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    };
  } catch (error) {
    console.error('Balance fetch error:', error);
    // Return fallback balance from localStorage if available
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return {
          availableBalance: Number(user.balance) || 0,
          pendingBalance: 0,
          totalBalance: Number(user.balance) || 0,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (fallbackError) {
      console.error('Fallback balance error:', fallbackError);
    }
    
    throw error;
  }
};

const submitDeposit = async (userId: number, amount: number, method: string) => {
  const response = await fetch('/api/transactions/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      userId,
      amount,
      method,
      type: 'deposit'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to submit deposit');
  }

  return response.json();
};

// Investment Plans Data (Updated with accurate values)
const INVESTMENT_PLANS = [
  {
    id: 'starter',
    name: 'STARTER PLAN',
    minAmount: 50,
    maxAmount: 999,
    dailyProfit: '2',
    duration: '3 days',
    totalReturn: '106%',
    description: 'Perfect for beginners starting their investment journey.',
    color: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'premium',
    name: 'PREMIUM PLAN',
    minAmount: 1000,
    maxAmount: 4999,
    dailyProfit: '3.5',
    duration: '7 days',
    totalReturn: '124.5%',
    description: 'For serious investors looking for higher returns.',
    color: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800'
  },
  {
    id: 'delux',
    name: 'DELUX PLAN',
    minAmount: 5000,
    maxAmount: 19999,
    dailyProfit: '5',
    duration: '10 days',
    totalReturn: '150%',
    description: 'For experienced investors seeking substantial returns.',
    color: 'bg-purple-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'luxury',
    name: 'LUXURY PLAN',
    minAmount: 20000,
    maxAmount: null, // UNLIMITED
    dailyProfit: '7.5',
    duration: '30 days',
    totalReturn: '325%',
    description: 'Our premium plan for high-volume investors with unlimited maximum.',
    color: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800'
  }
];

// Crypto Addresses
const CRYPTO_ADDRESSES = {
  bitcoin: 'bc1qs0fygvepn2e6am0camsnxgwz8g6sexnmupwu58',
  ethereum: '0x742d35Cc7dB8C4B62b5F9BBD3D9C56E1234567890',
  usdt: 'TQrZZs0fygvepn2e6am0camsnxgwz8g6sexnmupwu58',
  bnb: 'bnb1s0fygvepn2e6am0camsnxgwz8g6sexnmupwu58'
};

const NewDeposit: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('starter'); // Default to starter plan
  const [selectedMethod, setSelectedMethod] = useState('bitcoin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [depositDetails, setDepositDetails] = useState<any>(null);

  // Fetch user balance
  const { 
    data: balance, 
    isLoading: balanceLoading, 
    error: balanceError,
    refetch: refetchBalance 
  } = useQuery({
    queryKey: ['userBalance', user?.id],
    queryFn: () => fetchUserBalance(user?.id as number),
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 3,
  });

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      toast({
        title: 'Copied!',
        description: `${type} address copied to clipboard`,
      });
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async ({ amount, method, plan }: { amount: number, method: string, plan: string }) => {
      // Get plan details for profit calculation
      const planDetails = INVESTMENT_PLANS.find(p => p.id === plan);
      if (!planDetails) {
        throw new Error('Invalid investment plan selected');
      }

      // Calculate expected returns
      const dailyProfit = (amount * parseFloat(planDetails.dailyProfit)) / 100;
      const totalReturn = (amount * parseFloat(planDetails.totalReturn.replace('%', ''))) / 100;

      // If paying with account balance, process immediately
      if (method === 'balance') {
        const response = await fetch('/api/transactions/deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            userId: user?.id,
            amount,
            method: 'balance',
            plan,
            planName: planDetails.name,
            planDuration: planDetails.duration,
            dailyProfit: dailyProfit,
            totalReturn: totalReturn,
            type: 'deposit'  // Changed from 'investment' to 'deposit' so it shows in admin panel
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to process deposit');
        }

        return response.json();
      } else {
        // For crypto payments, save details to localStorage and redirect to confirmation page
        const details = {
          amount: amount.toString(),
          selectedPlan: plan,
          selectedMethod: method,
          walletAddress: CRYPTO_ADDRESSES[method as keyof typeof CRYPTO_ADDRESSES],
          planName: planDetails.name,
          planDuration: planDetails.duration,
          dailyProfit: dailyProfit,
          totalReturn: totalReturn
        };
        localStorage.setItem('depositDetails', JSON.stringify(details));
        setLocation('/client/deposit-confirmation');
        return { success: true, requiresConfirmation: true };
      }
    },
    onSuccess: (data, variables) => {
      if (variables.method === 'balance') {
        // For balance payments, invalidate queries and show success
        queryClient.invalidateQueries({ queryKey: ['userBalance', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['userTransactions', user?.id] });
        
        toast({
          title: 'Deposit Successful',
          description: `Successfully deposited ${formatCurrency(variables.amount)} from your account balance.`,
        });
        
        // Reset form
        setAmount('');
        setSelectedMethod('bitcoin');
        setSelectedPlan('starter');
        
        // Redirect to dashboard
        setTimeout(() => {
          setLocation('/dashboard');
        }, 1500);
      }
      // For crypto payments, modal handles the flow
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'There was an error processing your request.',
        variant: 'destructive'
      });
    }
  });

  // Handle deposit submission
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount.',
        variant: 'destructive'
      });
      return;
    }

    if (Number(amount) < 50) {
      toast({
        title: 'Minimum Amount',
        description: 'Minimum deposit amount is $50.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedPlan) {
      toast({
        title: 'Select Plan',
        description: 'Please select an investment plan.',
        variant: 'destructive'
      });
      return;
    }

    // Validate amount fits the selected plan
    const plan = INVESTMENT_PLANS.find(p => p.id === selectedPlan);
    if (plan) {
      if (Number(amount) < plan.minAmount) {
        toast({
          title: 'Amount Too Low',
          description: `Minimum amount for ${plan.name} is ${formatCurrency(plan.minAmount)}.`,
          variant: 'destructive'
        });
        return;
      }
      if (plan.maxAmount && Number(amount) > plan.maxAmount) {
        toast({
          title: 'Amount Too High',
          description: `Maximum amount for ${plan.name} is ${formatCurrency(plan.maxAmount)}.`,
          variant: 'destructive'
        });
        return;
      }
    }

    // Check if paying with account balance and validate sufficient funds
    if (selectedMethod === 'balance') {
      if (Number(amount) > (balance?.availableBalance || 0)) {
        toast({
          title: 'Insufficient Balance',
          description: `You only have ${formatCurrency(balance?.availableBalance || 0)} available in your account.`,
          variant: 'destructive'
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await depositMutation.mutateAsync({
        amount: Number(amount),
        method: selectedMethod,
        plan: selectedPlan
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get plan for amount
  const getCurrentPlan = () => {
    const amountNum = Number(amount);
    return INVESTMENT_PLANS.find(plan => 
      amountNum >= plan.minAmount && (plan.maxAmount === null || amountNum <= plan.maxAmount)
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ArrowDownRight className="h-8 w-8 text-green-600" />
          Deposit Funds
        </h1>
        <p className="text-gray-600 mt-2">
          Add funds to your account and start earning with our investment plans.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Deposit Form */}
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
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error loading balance</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Available Balance:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(balance?.availableBalance || 0)}
                    </span>
                  </div>
                  {balance?.pendingBalance > 0 && (
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

          {/* Investment Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INVESTMENT_PLANS.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`p-4 rounded-lg border-2 ${plan.color} transition-all cursor-pointer ${
                      selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <Badge className={plan.badge}>
                        {plan.dailyProfit}% Daily
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatCurrency(plan.minAmount)} - {plan.maxAmount === null ? 'UNLIMITED' : formatCurrency(plan.maxAmount)}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Duration: {plan.duration}</div>
                      <div>Total Return: {plan.totalReturn}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deposit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Deposit Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeposit} className="space-y-6">
                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount (minimum $50)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="50"
                    step="0.01"
                    className="text-lg"
                  />
                  {getCurrentPlan() && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>{getCurrentPlan()!.name}</strong> - 
                        {getCurrentPlan()!.dailyProfit}% daily profit for {getCurrentPlan()!.duration}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                    {/* Account Balance Option */}
                    <Button
                      type="button"
                      variant={selectedMethod === 'balance' ? 'default' : 'outline'}
                      onClick={() => setSelectedMethod('balance')}
                      className="h-auto p-4"
                    >
                      <div className="text-center">
                        <Wallet className="h-6 w-6 mx-auto mb-1" />
                        <div className="text-xs">Balance</div>
                        <div className="text-xs text-gray-500">
                          ${formatCurrency(balance?.availableBalance || 0)}
                        </div>
                      </div>
                    </Button>
                    
                    {/* Crypto Payment Options */}
                    {Object.entries(CRYPTO_ADDRESSES).map(([crypto, address]) => (
                      <Button
                        key={crypto}
                        type="button"
                        variant={selectedMethod === crypto ? 'default' : 'outline'}
                        onClick={() => setSelectedMethod(crypto)}
                        className="h-auto p-4"
                      >
                        <div className="text-center">
                          <CreditCard className="h-6 w-6 mx-auto mb-1" />
                          <div className="text-xs capitalize">{crypto}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg"
                  disabled={!amount || !selectedPlan || isSubmitting || Number(amount) < 50}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Deposit {amount ? formatCurrency(Number(amount)) : 'Funds'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment Instructions */}
        <div className="space-y-6">
          {/* Selected Payment Method */}
          {selectedMethod && (
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{selectedMethod} Deposit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Send to this address:</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border break-all font-mono text-sm">
                    {CRYPTO_ADDRESSES[selectedMethod as keyof typeof CRYPTO_ADDRESSES]}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => copyToClipboard(
                      CRYPTO_ADDRESSES[selectedMethod as keyof typeof CRYPTO_ADDRESSES], 
                      selectedMethod
                    )}
                  >
                    {copySuccess === selectedMethod ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Address
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Send exact amount to the address above</li>
                        <li>• Minimum deposit: $50</li>
                        <li>• Processing time: 1-3 confirmations</li>
                        <li>• Contact support if issues arise</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profit Calculator */}
          {amount && getCurrentPlan() && (
            <Card>
              <CardHeader>
                <CardTitle>Profit Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Investment:</span>
                    <span className="font-semibold">{formatCurrency(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Profit:</span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(Number(amount) * Number(getCurrentPlan()!.dailyProfit) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Return:</span>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(Number(amount) * Number(getCurrentPlan()!.totalReturn.replace('%', '')) / 100)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Duration: {getCurrentPlan()!.duration}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Deposit Confirmation Modal removed, now handled by confirmation page */}
    </div>
  );
};

export default NewDeposit;
