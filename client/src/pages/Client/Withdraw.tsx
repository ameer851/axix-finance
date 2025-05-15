import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, Wallet } from 'lucide-react';
import { withdrawFunds, getUserBalance } from '@/services/transactionService';

const Withdraw: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [accountDetails, setAccountDetails] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    address: ''
  });
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: () => getUserBalance(user?.id),
    enabled: !!user?.id,
    staleTime: 60000 // 1 minute
  });

  // Make sure availableBalance is a number
  const availableBalance = balanceData?.availableBalance ? Number(balanceData.availableBalance) : 0;

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: withdrawFunds,
    onMutate: () => {
      setIsProcessing(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', user?.id] });
      
      toast({
        title: 'Withdrawal Request Submitted',
        description: `Your withdrawal request for $${data.amount} has been submitted and is pending approval.`,
      });
      
      setAmount('');
      setAccountDetails({
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        address: ''
      });
      setCryptoAddress('');
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'There was an error processing your withdrawal. Please try again.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  });

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount.',
        variant: 'destructive'
      });
      return;
    }
    
    if (parseFloat(amount) > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `Your available balance is $${Number(availableBalance).toFixed(2)}.`,
        variant: 'destructive'
      });
      return;
    }
    
    let withdrawalDetails = {};
    
    if (withdrawMethod === 'bank') {
      // Validate bank details
      if (!accountDetails.bankName || !accountDetails.accountName || !accountDetails.accountNumber) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required bank account details.',
          variant: 'destructive'
        });
        return;
      }
      withdrawalDetails = { ...accountDetails };
    } else if (withdrawMethod === 'crypto') {
      // Validate crypto address
      if (!cryptoAddress) {
        toast({
          title: 'Missing Information',
          description: 'Please enter your cryptocurrency wallet address.',
          variant: 'destructive'
        });
        return;
      }
      withdrawalDetails = { cryptoAddress };
    }
    
    withdrawMutation.mutate({
      userId: user?.id,
      amount: parseFloat(amount),
      method: withdrawMethod,
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

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Withdraw Funds</CardTitle>
          <CardDescription>Request a withdrawal from your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Balance:</span>
              <span className="text-xl font-bold">
                {balanceLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `$${Number(availableBalance).toFixed(2)}`
                )}
              </span>
            </div>
          </div>
          
          <Tabs defaultValue="bank" onValueChange={setWithdrawMethod}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="bank">
                <DollarSign className="h-4 w-4 mr-2" />
                Bank Transfer
              </TabsTrigger>
              <TabsTrigger value="crypto">
                <Wallet className="h-4 w-4 mr-2" />
                Cryptocurrency
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="bank">
              <form onSubmit={handleWithdraw}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      placeholder="Enter amount"
                      type="number"
                      min="10"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-1"
                    />
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
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      placeholder="Enter bank name"
                      value={accountDetails.bankName}
                      onChange={(e) => setAccountDetails({...accountDetails, bankName: e.target.value})}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="account-name">Account Holder Name</Label>
                    <Input
                      id="account-name"
                      placeholder="Enter account holder name"
                      value={accountDetails.accountName}
                      onChange={(e) => setAccountDetails({...accountDetails, accountName: e.target.value})}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account-number">Account Number</Label>
                      <Input
                        id="account-number"
                        placeholder="Enter account number"
                        value={accountDetails.accountNumber}
                        onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="routing-number">Routing Number</Label>
                      <Input
                        id="routing-number"
                        placeholder="Enter routing number"
                        value={accountDetails.routingNumber}
                        onChange={(e) => setAccountDetails({...accountDetails, routingNumber: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bank-address">Bank Address (Optional)</Label>
                    <Input
                      id="bank-address"
                      placeholder="Enter bank address"
                      value={accountDetails.address}
                      onChange={(e) => setAccountDetails({...accountDetails, address: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p>Note: Withdrawals are typically processed within 1-3 business days. A fee of $25 may apply for international wire transfers.</p>
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
            </TabsContent>
            
            <TabsContent value="crypto">
              <form onSubmit={handleWithdraw}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="crypto-amount">Amount (USD)</Label>
                    <Input
                      id="crypto-amount"
                      placeholder="Enter amount"
                      type="number"
                      min="10"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-1"
                    />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Withdraw;
