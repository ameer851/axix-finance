import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed unused Tabs imports

import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, Wallet, Copy, Check } from 'lucide-react';
import { depositFunds } from '@/services/transactionService';
import { getInvestmentPlans, getCryptoExchangeRates, InvestmentPlan, BANK_TRANSFER_DETAILS } from '@/services/investmentService';
import { getUserBalance } from '@/services/userService';
import { formatCurrency } from "@/lib/utils";

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
  
  // Fetch user balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: () => getUserBalance(user?.id),
    enabled: !!user?.id,
    staleTime: 60000 // 1 minute
  });
  
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

  // Plan options
  const planOptions = [
    {
      id: 'starter',
      name: 'Starter plan',
      spentRange: '$150.00 - $995.00',
      dailyProfit: '1.50',
    },
    {
      id: 'premium',
      name: 'Premium plan',
      spentRange: '$1000.00 - $4995.00',
      dailyProfit: '3.00',
    },
    {
      id: 'deluxe',
      name: 'Deluxe plan',
      spentRange: '$5000.00 - $19999.00',
      dailyProfit: '5.00',
    },
    {
      id: 'luxury',
      name: 'Luxury plan',
      spentRange: '$20000.00 and more',
      dailyProfit: '7.50',
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState('starter');

  return (
    <div>
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Make a Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDeposit}>
              {/* Plan Selection */}
              <div className="mb-6">
                <Label className="mb-2 block font-semibold text-amber-900">Select a plan:</Label>
                {planOptions.map((plan) => (
                  <div key={plan.id} className="border-b border-amber-100 py-2 flex items-center">
                    <input
                      type="radio"
                      id={plan.id}
                      name="depositPlan"
                      value={plan.id}
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                      className="accent-amber-700 mr-2"
                      aria-label={plan.name}
                    />
                    <div className="flex flex-col w-full">
                      <Label htmlFor={plan.id} className="font-semibold text-amber-800">{plan.name}</Label>
                      <div className="flex flex-wrap gap-4 text-xs text-amber-700 mt-1">
                        <span>Spent Amount: <span className="font-medium">{plan.spentRange}</span></span>
                        <span>Daily Profit: <span className="font-medium">{plan.dailyProfit}%</span></span>
                        <span className="ml-auto text-amber-600 underline cursor-pointer">Calculate your profit &gt;&gt;</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Account Balance */}
              <div className="mb-4">
                <Label className="font-semibold text-amber-900">Your account balance ($):</Label>
                <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-1 text-amber-900">
                  {balanceLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    formatCurrency(balanceData?.availableBalance || parseFloat(user?.balance || '0'))
                  )}
                </div>
              </div>
              {/* Amount Input */}
              <div className="mb-4">
                <Label className="font-semibold text-amber-900" htmlFor="depositAmount">Deposit Amount ($):</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              {/* Funding Source */}
              <div className="mb-6">
                <Label className="mb-2 block font-semibold text-amber-900">Select Funding Source:</Label>
                <div className="flex flex-wrap gap-2 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fundingSource"
                      value="balance"
                      checked={selectedCrypto === 'balance'}
                      onChange={() => setSelectedCrypto('balance')}
                      className="accent-amber-700 mr-2"
                    />
                    <span>Spend from account balance</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fundingSource"
                      value="bitcoin"
                      checked={selectedCrypto === 'bitcoin'}
                      onChange={() => setSelectedCrypto('bitcoin')}
                      className="accent-amber-700 mr-2"
                    />
                    <span>Spend funds from Bitcoin</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fundingSource"
                      value="bitcoinCash"
                      checked={selectedCrypto === 'bitcoinCash'}
                      onChange={() => setSelectedCrypto('bitcoinCash')}
                      className="accent-amber-700 mr-2"
                    />
                    <span>Spend funds from Bitcoin Cash</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fundingSource"
                      value="ethereum"
                      checked={selectedCrypto === 'ethereum'}
                      onChange={() => setSelectedCrypto('ethereum')}
                      className="accent-amber-700 mr-2"
                    />
                    <span>Spend funds from Ethereum</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fundingSource"
                      value="usdt"
                      checked={selectedCrypto === 'usdt'}
                      onChange={() => setSelectedCrypto('usdt')}
                      className="accent-amber-700 mr-2"
                    />
                    <span>Spend funds from USDT (TRC20)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fundingSource"
                      value="bnb"
                      checked={selectedCrypto === 'bnb'}
                      onChange={() => setSelectedCrypto('bnb')}
                      className="accent-amber-700 mr-2"
                    />
                    <span>Spend funds from BNB</span>
                  </label>
                </div>
              </div>
              {/* Crypto Address and Copy Button - Only show for crypto options */}
              {selectedCrypto !== 'balance' && (
                <>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-md my-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-amber-900">
                        {selectedCrypto === 'bitcoin' ? 'Bitcoin' : 
                         selectedCrypto === 'bitcoinCash' ? 'Bitcoin Cash' : 
                         selectedCrypto === 'ethereum' ? 'Ethereum' : selectedCrypto === 'bnb' ? 'BNB' : 'USDT'} Deposit Address
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
                       selectedCrypto === 'ethereum' ? 'Ethereum (ETH)' : selectedCrypto === 'bnb' ? 'BNB (BSC)' : 'USDT (TRC20)'} 
                      to Axix Finance's official wallet address below:
                    </p>
                    <div className="bg-white p-3 rounded border border-amber-300 break-all font-mono text-xs text-amber-900">
                      {starterPlan?.walletAddresses[selectedCrypto as keyof typeof starterPlan.walletAddresses]}
                    </div>
                  </div>
                  {/* Important Note */}
                  <div className="mt-2 text-xs text-amber-700 bg-amber-100 p-2 rounded-md">
                    <strong>Important:</strong> After sending your deposit, please click the confirmation button below and provide your transaction ID when prompted by our team. Your account will be credited once the transaction is confirmed on the blockchain.
                  </div>
                </>
              )}
              
              {/* Account Balance Option Info */}
              {selectedCrypto === 'balance' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md my-4">
                  <h3 className="font-medium text-blue-900 mb-2">Using Account Balance</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    You are about to invest from your current account balance.
                  </p>
                  <p className="text-sm text-blue-900 font-medium">
                    Available Balance: ${user?.balance ?? 0}
                  </p>
                  {parseFloat(amount) > parseFloat(user?.balance ?? '0') && (
                    <p className="text-sm text-red-600 mt-2">
                      <strong>Note:</strong> Insufficient balance. Please reduce the amount or choose a crypto funding option.
                    </p>
                  )}
                </div>
              )}
              
              {/* Exchange Rate and Amount to Send - Only for crypto */}
              {selectedCrypto !== 'balance' && !ratesLoading && exchangeRates && (
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
              {amount && selectedCrypto !== 'balance' && !ratesLoading && exchangeRates && (
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
              {/* Confirmation Button */}
              <Button 
                onClick={handleDeposit} 
                className="w-full bg-amber-800 hover:bg-amber-700 text-white mt-6" 
                disabled={isProcessing || (selectedCrypto === 'balance' && parseFloat(amount) > parseFloat(user?.balance ?? '0'))}
                type="submit"
              >
                {isProcessing ? 'Processing...' : 
                 selectedCrypto === 'balance' ? 'Invest from Balance' :
                 `I've Sent ${selectedCrypto === 'bitcoin' ? 'Bitcoin' : selectedCrypto === 'bitcoinCash' ? 'Bitcoin Cash' : selectedCrypto === 'ethereum' ? 'Ethereum' : selectedCrypto === 'bnb' ? 'BNB' : 'USDT'} to Axix Finance`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
  );
}

export default Deposit;