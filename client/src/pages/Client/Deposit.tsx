import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, Wallet, Copy, Check } from 'lucide-react';
import { depositFunds } from '@/services/transactionService';
import { getInvestmentPlans, getCryptoExchangeRates, InvestmentPlan, BANK_TRANSFER_DETAILS } from '@/services/investmentService';

const Deposit: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  // Fetch investment plans for wallet addresses
  const { data: investmentPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['investmentPlans'],
    queryFn: getInvestmentPlans,
    staleTime: 600000 // 10 minutes
  });
  
  // Fetch crypto exchange rates
  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['cryptoRates'],
    queryFn: getCryptoExchangeRates,
    staleTime: 300000 // 5 minutes
  });
  
  // Get the starter plan for default wallet addresses
  const starterPlan = investmentPlans?.find(plan => plan.id === 'starter');
  
  // Function to copy wallet address to clipboard
  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    toast({
      title: 'Address Copied',
      description: 'Wallet address has been copied to clipboard',
    });
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedAddress(false);
    }, 2000);
  };

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: depositFunds,
    onMutate: () => {
      setIsProcessing(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', user?.id] });
      
      toast({
        title: 'Deposit Successful',
        description: `$${data.amount} has been added to your account.`,
      });
      
      setAmount('');
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Deposit Failed',
        description: error.message || 'There was an error processing your deposit. Please try again.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount.',
        variant: 'destructive'
      });
      return;
    }
    
    depositMutation.mutate({
      userId: user?.id,
      amount: parseFloat(amount),
      method: paymentMethod,
      currency: 'USD'
    });
  };

  const handleQuickAmount = (value: string) => {
    setAmount(value);
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Make a Deposit</CardTitle>
          <CardDescription>Add funds to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="crypto" onValueChange={setPaymentMethod}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="card">
                <CreditCard className="h-4 w-4 mr-2" />
                Credit Card
              </TabsTrigger>
              <TabsTrigger value="bank">
                <DollarSign className="h-4 w-4 mr-2" />
                Bank Transfer
              </TabsTrigger>
              <TabsTrigger value="crypto">
                <Wallet className="h-4 w-4 mr-2" />
                Cryptocurrency
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="card">
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-md text-center">
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">Credit Card Payments Coming Soon</h3>
                  <p className="text-amber-700 mb-4">We're currently working on implementing credit card payments. Please use cryptocurrency for deposits at this time.</p>
                  <Button 
                    variant="outline" 
                    className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => setPaymentMethod('crypto')}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Switch to Cryptocurrency
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="bank">
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-md text-center">
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">Bank Transfer Coming Soon</h3>
                  <p className="text-amber-700 mb-4">We're currently working on implementing bank transfer payments. Please use cryptocurrency for deposits at this time.</p>
                  <Button 
                    variant="outline" 
                    className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => setPaymentMethod('crypto')}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Switch to Cryptocurrency
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="crypto">
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
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    type="button" 
                    variant={selectedCrypto === 'bitcoin' ? 'default' : 'outline'}
                    onClick={() => setSelectedCrypto('bitcoin')}
                    className="flex items-center justify-center bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    Bitcoin (BTC)
                  </Button>
                  <Button 
                    type="button" 
                    variant={selectedCrypto === 'bitcoinCash' ? 'default' : 'outline'}
                    onClick={() => setSelectedCrypto('bitcoinCash')}
                    className="flex items-center justify-center bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    Bitcoin Cash (BCH)
                  </Button>
                  <Button 
                    type="button" 
                    variant={selectedCrypto === 'ethereum' ? 'default' : 'outline'}
                    onClick={() => setSelectedCrypto('ethereum')}
                    className="flex items-center justify-center bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    Ethereum (ETH)
                  </Button>
                  <Button 
                    type="button" 
                    variant={selectedCrypto === 'bnb' ? 'default' : 'outline'}
                    onClick={() => setSelectedCrypto('bnb')}
                    className="flex items-center justify-center bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    BNB (BSC)
                  </Button>
                  <Button 
                    type="button" 
                    variant={selectedCrypto === 'usdt' ? 'default' : 'outline'}
                    onClick={() => setSelectedCrypto('usdt')}
                    className="flex items-center justify-center bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    USDT (TRC20)
                  </Button>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                  {plansLoading ? (
                    <div className="animate-pulse flex flex-col space-y-2">
                      <div className="h-4 bg-amber-200 rounded w-1/3"></div>
                      <div className="h-4 bg-amber-200 rounded w-1/2"></div>
                      <div className="h-10 bg-amber-200 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-amber-900">
                          {selectedCrypto === 'bitcoin' ? 'Bitcoin' : 
                           selectedCrypto === 'bitcoinCash' ? 'Bitcoin Cash' : 
                           selectedCrypto === 'ethereum' ? 'Ethereum' : 'USDT'} Deposit Address
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(starterPlan?.walletAddresses[selectedCrypto as keyof typeof starterPlan.walletAddresses] || '')}
                          className="h-8 px-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                        >
                          {copiedAddress ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-amber-700 mb-4">
                        Please send your deposit in 
                        {selectedCrypto === 'bitcoin' ? 'Bitcoin (BTC)' : 
                         selectedCrypto === 'bitcoinCash' ? 'Bitcoin Cash (BCH)' : 
                         selectedCrypto === 'ethereum' ? 'Ethereum (ETH)' : 'USDT (TRC20)'} 
                        to Carax Finance's official wallet address below:
                      </p>
                      <div className="bg-white p-3 rounded border border-amber-300 break-all font-mono text-xs text-amber-900">
                        {starterPlan?.walletAddresses[selectedCrypto as keyof typeof starterPlan.walletAddresses]}
                      </div>
                      <div className="mt-2 text-xs text-amber-700 bg-amber-100 p-2 rounded-md">
                        <strong>Important:</strong> After sending your deposit, please click the confirmation button below and provide your transaction ID when prompted by our team. Your account will be credited once the transaction is confirmed on the blockchain.
                      </div>
                      {!ratesLoading && exchangeRates && (
                        <p className="text-sm text-amber-700 mt-4">
                          Current Exchange Rate: 1 
                          {selectedCrypto === 'bitcoin' ? 'BTC' : 
                           selectedCrypto === 'bitcoinCash' ? 'BCH' : 
                           selectedCrypto === 'ethereum' ? 'ETH' :
                           selectedCrypto === 'bnb' ? 'BNB' : 'USDT'} = 
                          ${selectedCrypto === 'bitcoin' 
                            ? exchangeRates.bitcoin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : selectedCrypto === 'bitcoinCash'
                              ? exchangeRates.bitcoinCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : selectedCrypto === 'ethereum'
                                ? exchangeRates.ethereum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : selectedCrypto === 'bnb'
                                  ? exchangeRates.bnb.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : exchangeRates.usdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          } USD
                        </p>
                      )}
                      {amount && !ratesLoading && exchangeRates && (
                        <p className="text-sm text-amber-900 font-medium mt-2">
                          You need to send: {(parseFloat(amount) / (selectedCrypto === 'bitcoin' 
                            ? exchangeRates.bitcoin
                            : selectedCrypto === 'bitcoinCash'
                              ? exchangeRates.bitcoinCash
                              : selectedCrypto === 'ethereum'
                                ? exchangeRates.ethereum
                                : selectedCrypto === 'bnb'
                                  ? exchangeRates.bnb
                                  : exchangeRates.usdt
                          )).toFixed(8)} 
                          {selectedCrypto === 'bitcoin' ? 'BTC' : 
                           selectedCrypto === 'bitcoinCash' ? 'BCH' : 
                           selectedCrypto === 'ethereum' ? 'ETH' :
                           selectedCrypto === 'bnb' ? 'BNB' : 'USDT'}
                        </p>
                      )}
                    </>
                  )}
                </div>
                
                <Button 
                  onClick={handleDeposit} 
                  className="w-full bg-amber-800 hover:bg-amber-700 text-white" 
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `I've Sent ${selectedCrypto === 'bitcoin' ? 'Bitcoin' : selectedCrypto === 'bitcoinCash' ? 'Bitcoin Cash' : selectedCrypto === 'ethereum' ? 'Ethereum' : 'USDT'} to Carax Finance`}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Deposit;
