import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { depositFunds, withdrawFunds, investInSecurity } from '@/services/portfolioService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getUserTransactions } from '@/services/transactionService';

// Import dashboard components
import PortfolioOverview from '@/components/dashboard/PortfolioOverview';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import Widget360 from '@/components/dashboard/Widget360';
import GoalsPlanning from '@/components/dashboard/GoalsPlanning';

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'monero', symbol: 'XMR', name: 'Monero' },
  { id: 'dash', symbol: 'DASH', name: 'Dash' },
];
const CURRENCIES = ['usd', 'eur', 'cny', 'gbp'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialogs
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  
  // State for dialog inputs
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [investSymbol, setInvestSymbol] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  
  const [cryptoData, setCryptoData] = useState<any>({});
  const [currency, setCurrency] = useState('usd');
  const [loading, setLoading] = useState(false);

  // Fetch user transactions
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => getUserTransactions(user?.id),
    enabled: !!user?.id,
  });

  // Calculate real values
  const totalDeposit = transactions
    .filter((t: any) => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  const totalWithdraw = transactions
    .filter((t: any) => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  const activeDeposit = transactions
    .filter((t: any) => t.type === 'deposit' && t.status === 'pending')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  // Fetch live crypto prices
  useEffect(() => {
    setLoading(true);
    fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.map(c => c.id).join(',')}&vs_currencies=${CURRENCIES.join(',')}&include_24hr_change=true`
    )
      .then(res => res.json())
      .then(data => {
        setCryptoData(data);
        setLoading(false);
      });
  }, []);

  // Helper for formatting
  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, { style: 'currency', currency: currency.toUpperCase() });
  
  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      // Call the real API function
      return await depositFunds(user?.id as number, parseFloat(amount));
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', user?.id] });
      toast({
        title: 'Deposit Successful',
        description: `$${data.amount} has been added to your account.`,
      });
      setShowDepositDialog(false);
      setDepositAmount('');
    },
    onError: (error) => {
      toast({
        title: 'Deposit Failed',
        description: 'There was an error processing your deposit. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: string) => {
      // Call the real API function
      return await withdrawFunds(user?.id as number, parseFloat(amount));
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', user?.id] });
      toast({
        title: 'Withdrawal Successful',
        description: `$${data.amount} has been withdrawn from your account.`,
      });
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
    },
    onError: (error) => {
      toast({
        title: 'Withdrawal Failed',
        description: 'There was an error processing your withdrawal. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Invest mutation
  const investMutation = useMutation({
    mutationFn: async ({ symbol, amount }: { symbol: string, amount: string }) => {
      // Call the real API function
      return await investInSecurity(user?.id as number, symbol, parseFloat(amount));
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', user?.id] });
      toast({
        title: 'Investment Successful',
        description: `$${data.amount} has been invested in ${data.symbol}.`,
      });
      setShowInvestDialog(false);
      setInvestSymbol('');
      setInvestAmount('');
    },
    onError: (error) => {
      toast({
        title: 'Investment Failed',
        description: 'There was an error processing your investment. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Handle deposit form submission
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount.',
        variant: 'destructive'
      });
      return;
    }
    depositMutation.mutate(depositAmount);
  };
  
  // Handle withdraw form submission
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount.',
        variant: 'destructive'
      });
      return;
    }
    
    // In a real app, you would check if the user has enough balance
    withdrawMutation.mutate(withdrawAmount);
  };
  
  // Handle invest form submission
  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investSymbol) {
      toast({
        title: 'Missing Symbol',
        description: 'Please select a security to invest in.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!investAmount || isNaN(parseFloat(investAmount)) || parseFloat(investAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid investment amount.',
        variant: 'destructive'
      });
      return;
    }
    
    investMutation.mutate({ symbol: investSymbol, amount: investAmount });
  };
  
  // Handle portfolio actions
  const handlePortfolioAction = {
    deposit: () => setShowDepositDialog(true),
    withdraw: () => setShowWithdrawDialog(true),
    invest: () => setShowInvestDialog(true),
    rebalance: () => {
      toast({
        title: 'Portfolio Rebalancing',
        description: 'Your portfolio rebalancing request has been submitted.',
      });
    }
  };
  
  // Handle 360 widget actions
  const handle360Action = {
    refresh: () => {
      toast({
        title: 'Market Data Refreshed',
        description: 'Latest market data has been updated.',
      });
    }
  };
  
  // Handle goal actions
  const handleGoalAction = {
    createGoal: () => setShowGoalDialog(true),
    editGoal: (goalId: string) => {
      toast({
        title: 'Edit Goal',
        description: `Editing goal ${goalId}`,
      });
    },
    deleteGoal: (goalId: string) => {
      toast({
        title: 'Delete Goal',
        description: `Goal ${goalId} has been deleted.`,
      });
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-8 py-8 max-w-7xl mx-auto">
      {/* Overview Card */}
      <div className="w-full md:w-1/3">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span>Active Deposit</span>
                <span className="font-bold">${activeDeposit.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-green-200 rounded-full">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: totalDeposit > 0 ? `${Math.min((activeDeposit / totalDeposit) * 100, 100)}%` : '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span>Total Deposit</span>
                <span className="font-bold">${totalDeposit.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-lime-200 rounded-full">
                <div className="h-2 bg-lime-500 rounded-full" style={{ width: totalDeposit > 0 ? '100%' : '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span>Total Withdraw</span>
                <span className="font-bold">${totalWithdraw.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-red-200 rounded-full">
                <div className="h-2 bg-red-400 rounded-full" style={{ width: totalDeposit > 0 ? `${Math.min((totalWithdraw / totalDeposit) * 100, 100)}%` : '0%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account & Crypto Card */}
      <div className="w-full md:w-2/3 flex flex-col items-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-base">Your Referral Link:</CardTitle>
            <CardDescription className="text-center">
              <a
                href={`https://axix-finance.co/?ref=${user?.username || user?.firstName || 'user'}`}
                className="text-blue-700 font-semibold break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://axix-finance.co/?ref={user?.username || user?.firstName || 'user'}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <div className="mb-2 font-semibold">Your account</div>
              <div className="flex justify-between text-sm mb-1"><span>User:</span> <span>{user?.username || user?.firstName || 'user'}</span></div>
              <div className="flex justify-between text-sm mb-1"><span>Last Access:</span> <span>{new Date().toLocaleString()}</span></div>
              <div className="flex justify-between text-sm mb-1"><span>Account Balance:</span> <span>${totalDeposit - totalWithdraw}</span></div>
            </div>

            {/* Crypto Prices */}
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                {CURRENCIES.map(cur => (
                  <Button
                    key={cur}
                    size="sm"
                    variant={currency === cur ? 'default' : 'outline'}
                    onClick={() => setCurrency(cur)}
                  >
                    {cur.toUpperCase()}
                  </Button>
                ))}
              </div>
              <div className="bg-white rounded-lg border p-2">
                {loading ? (
                  <div className="text-center text-sm text-gray-400">Loading prices...</div>
                ) : (
                  COINS.map(coin => (
                    <div key={coin.id} className="flex items-center justify-between py-1 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{coin.symbol}</span>
                        <span className="text-xs text-gray-500">{coin.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{cryptoData[coin.id]?.[currency] ? formatCurrency(cryptoData[coin.id][currency]) : '--'}</span>
                        <span className={
                          cryptoData[coin.id]?.[`${currency}_24h_change`] > 0
                            ? 'text-green-600 text-xs'
                            : 'text-red-600 text-xs'
                        }>
                          {cryptoData[coin.id]?.[`${currency}_24h_change`] ?
                            `${cryptoData[coin.id][`${currency}_24h_change`].toFixed(2)}%` : '--'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Bitcoin Widget */}
            {/* <div className="mt-4">
              <iframe
                src="https://widgets.coingecko.com/coingecko-coin-price-chart-widget?coin_id=bitcoin&currency=usd&locale=en"
                width="100%"
                height="200"
                frameBorder="0"
                title="Bitcoin Live Chart"
                className="rounded-lg border"
                style={{ minWidth: 250 }}
                allowFullScreen
              ></iframe>
            </div> */}
          </CardContent>
        </Card>
        {/* Only keep the working Coin360 widget below the second card */}
        <div className="w-full max-w-md mx-auto mt-6">
          <iframe
            src="https://coin360.com/widget/map?theme=light"
            width="100%"
            height="400"
            frameBorder="0"
            style={{ border: 0, borderRadius: 8, minWidth: 250 }}
            title="Coin360 Market Map"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
