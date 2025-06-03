import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Wallet, AlertCircle } from 'lucide-react';
import { withdrawFunds, getUserBalance } from '@/services/transactionService';
import { handleError, ErrorCategory } from '@/services/errorService';
import { debounce, optimizeObject } from '@/lib/dataOptimization';

// Define the type for the balance data
interface BalanceData {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  lastUpdated: string;
}

// Define the type for withdrawal response
interface WithdrawalResponse {
  success: boolean;
  amount: number;
  transactionId: number;
}

const Withdraw: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');  const [cryptoAddress, setCryptoAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoBalances, setCryptoBalances] = useState<any[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);

  // Fetch user balance with retry for better reliability
  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = useQuery<BalanceData, Error>({
    queryKey: ['balance', user?.id],
    queryFn: () => getUserBalance(user?.id),
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    retry: 3
  });
  
  // Optimize balance data in a separate effect if needed
  const [optimizedBalanceData, setOptimizedBalanceData] = React.useState<BalanceData | null>(null);
    // Get access to updateUserBalance from Auth context
  const { updateUserBalance: updateGlobalUserBalance } = useAuth();
  
  React.useEffect(() => {
    if (balanceData) {
      // Store only what we need from the balance data
      setOptimizedBalanceData(balanceData as BalanceData);
      
      // Update the global user balance in the auth context
      if (balanceData.availableBalance) {
        updateGlobalUserBalance(balanceData.availableBalance);
      }
    }
  }, [balanceData, updateGlobalUserBalance]);
  
  // Handle balance fetch errors
  React.useEffect(() => {
    if (balanceError) {
      handleError(balanceError, {
        fallbackMessage: 'Unable to fetch your current balance. Please try refreshing the page.',
        context: { userId: user?.id, action: 'getUserBalance' }
      });
    }
  }, [balanceError, user?.id]);  // Make sure availableBalance is a proper number and log for debugging
  const availableBalance = balanceData?.availableBalance ? Number(balanceData.availableBalance) : 0;
  console.log('Current available balance:', availableBalance, 'from data:', balanceData);
  
  // Helper function to format currency consistently
  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  // Enhanced withdraw mutation with proper error handling and retry logic
  const withdrawMutation = useMutation<WithdrawalResponse, Error, any>({
    mutationFn: withdrawFunds,
    onMutate: () => {
      setIsProcessing(true);
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries      queryClient.invalidateQueries({ queryKey: ['portfolio', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', user?.id] });
      
      toast({
        title: 'Withdrawal Request Submitted',
        description: `Your withdrawal request for $${data.amount} has been submitted and is pending approval.`,
      });
        // Reset form
      setAmount('');
      setCryptoAddress('');
      setAmountError(null);
      setIsProcessing(false);
    },
    onError: (error: Error) => {
      // Use centralized error handling service
      handleError(error, {
        showToast: true,
        fallbackMessage: 'There was an error processing your withdrawal. Please try again.',        context: { 
          userId: user?.id,
          amount: parseFloat(amount),
          action: 'withdrawFunds'
        },
        onError: (appError) => {
          // Error is handled by the main onError handler
        }
      });
      
      setIsProcessing(false);
    },
    retry: 1 // Only retry once for mutations to avoid duplicate transactions
  });

  // Use debounced validation to improve performance during form input
  const validateAmount = useCallback((inputAmount: string): string | null => {
    if (!inputAmount || isNaN(parseFloat(inputAmount)) || parseFloat(inputAmount) <= 0) {
      return 'Please enter a valid withdrawal amount';
    }    if (parseFloat(inputAmount) > availableBalance) {
      return `Amount exceeds available balance of $${formatCurrency(availableBalance)}`;
    }
    
    return null;
  }, [availableBalance]);
  
  // Create a debounced version of the validation function
  const debouncedValidateAmount = useCallback(
    debounce((inputAmount: string, callback: (result: string | null) => void) => {
      const result = validateAmount(inputAmount);
      callback(result);
    }, 300),
    [validateAmount]
  );
  
  const [amountError, setAmountError] = useState<string | null>(null);
  
  // Validate amount on change with debounce for better UX
  const handleAmountChange = (value: string) => {
    setAmount(value);
    debouncedValidateAmount(value, setAmountError);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submission
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount.',
        variant: 'destructive'
      });
      return;
    }    if (parseFloat(amount) > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `Your available balance is $${formatCurrency(availableBalance)}.`,
        variant: 'destructive'
      });
      return;
    }
    let withdrawalDetails = {};
    
    // Enhanced crypto address validation
    if (!cryptoAddress) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your cryptocurrency wallet address.',
        variant: 'destructive'
      });
      return;
    }
    
    // Basic format validation for crypto addresses
    if (cryptoAddress.length < 26 || cryptoAddress.length > 100) {
      toast({
        title: 'Invalid Crypto Address',
        description: 'The wallet address you entered appears to be invalid.',
        variant: 'destructive'
      });
      return;
    }
    
    withdrawalDetails = { cryptoAddress };
      // Submit withdrawal request
    withdrawMutation.mutate({
      userId: user?.id,
      amount: parseFloat(amount),
      method: 'crypto',
      currency: 'USD',
      details: withdrawalDetails
    });
  };

  const handleQuickAmount = (percentage: number) => {
    if (availableBalance) {
      const calculatedAmount = (availableBalance * percentage / 100).toFixed(2);
      // Convert back to string since setAmount expects a string
      setAmount(calculatedAmount);
    }
  };

  // Define supported cryptos
  const cryptos = [
    { key: 'bitcoin', label: 'BITCOIN' },
    { key: 'bitcoinCash', label: 'Bitcoin cash' },
    { key: 'ethereum', label: 'Ethereum' },
    { key: 'usdt', label: 'Usdt trc20' },
    { key: 'bnb', label: 'BNB' },
  ];

  React.useEffect(() => {
    if (!user?.id) return;
    setCryptoLoading(true);
    setCryptoError(null);
    fetch(`/api/users/${user.id}/crypto-balances`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch crypto balances');
        return res.json();
      })
      .then(data => setCryptoBalances(data))
      .catch(err => setCryptoError(err.message))
      .finally(() => setCryptoLoading(false));
  }, [user?.id]);

  const withdrawalData = (cryptoBalances.length > 0 ? cryptoBalances : cryptos.map(crypto => ({
    ...crypto,
    processing: 0,
    available: 0,
    pending: 0,
    account: 'not set',
  }))); // fallback if no backend data

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-bold text-amber-900">Ask for withdrawal</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Account Balance and Pending Withdrawals */}          <div className="mb-4 flex flex-wrap justify-between items-center text-sm">
            <div>Account Balance:</div>            <div className="font-bold">
              {balanceLoading ? 
                <span className="animate-pulse">Loading...</span> : 
                `$${formatCurrency(availableBalance)}`
              }
            </div>
          </div>
          <div className="mb-2 flex flex-wrap justify-between items-center text-sm">
            <div>Pending Withdrawals:</div>
            <div className="font-bold">$0</div>
          </div>

          {/* Crypto Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-b border-amber-100 text-xs md:text-sm">
              <thead className="bg-amber-50">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold"> </th>
                  <th className="py-2 px-3 text-left font-semibold">Processing</th>
                  <th className="py-2 px-3 text-left font-semibold">Available</th>
                  <th className="py-2 px-3 text-left font-semibold">Pending</th>
                  <th className="py-2 px-3 text-left font-semibold">Account</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalData.map(row => (
                  <tr key={row.key} className="border-t border-amber-100">
                    <td className="py-2 px-3 font-medium text-amber-900">{row.label}</td>
                    <td className="py-2 px-3">${row.processing.toFixed(2)}</td>
                    <td className="py-2 px-3 text-green-600 font-semibold">${row.available.toFixed(2)}</td>
                    <td className="py-2 px-3 text-red-600 font-semibold">${row.pending.toFixed(2)}</td>
                    <td className="py-2 px-3 text-gray-500 italic">{row.account}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>          <div className="mt-3 text-xs text-gray-700">You have no funds to withdraw.</div>
          
          {/* Crypto Withdrawal Form */}
          <div className="mt-6">
            <div className="flex items-center mb-4">
              <Wallet className="mr-2 h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold">Cryptocurrency Withdrawal</h3>
            </div>
            
            <form onSubmit={handleWithdraw}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="crypto-amount">Amount (USD)</Label>
                  <div className="relative">
                    <Input
                      id="crypto-amount"
                      placeholder="Enter amount"
                      type="number"
                      min="10"
                      step="0.01"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className={`mt-1 ${amountError ? 'border-red-500' : ''}`}
                    />
                    {amountError && (
                      <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{amountError}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleQuickAmount(25)}
                  >
                    25%
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleQuickAmount(50)}
                  >
                    50%
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleQuickAmount(75)}
                  >
                    75%
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleQuickAmount(100)}
                  >
                    100%
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="crypto-address">Bitcoin Wallet Address</Label>
                  <Input
                    id="crypto-address"
                    placeholder="Enter your BTC wallet address"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p>Note: Cryptocurrency withdrawals are typically processed within 24 hours. A network fee may apply based on current blockchain conditions.</p>
                  <p className="mt-2">Current Exchange Rate: 1 BTC = $43,250.00 USD</p>
                  <p className="mt-2 font-medium">Estimated BTC: {amount && !isNaN(parseFloat(amount)) ? (parseFloat(amount) / 43250).toFixed(8) : '0.00000000'} BTC</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isProcessing || balanceLoading}
                >
                  {isProcessing ? 'Processing...' : 'Request Withdrawal'}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Withdraw;
