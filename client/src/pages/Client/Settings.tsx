import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Wallet, Briefcase, ShieldCheck } from 'lucide-react';
import { getUserProfile } from '@/services/userService';

// Define investment plans with real wallet addresses
const INVESTMENT_PLANS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    minAmount: 100,
    maxAmount: 1000,
    returnRate: '5-8% Monthly',
    duration: '3 Months',
    features: [
      'Basic portfolio management',
      'Weekly market updates',
      'Email support'
    ],
    walletAddresses: {
      bitcoin: 'bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58',
      bitcoinCash: 'qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g',
      ethereum: '0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32', // Same address for BNB
      bnb: '0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32',
      usdt: 'THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb'
    }
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    minAmount: 1000,
    maxAmount: 10000,
    returnRate: '8-12% Monthly',
    duration: '6 Months',
    features: [
      'Advanced portfolio management',
      'Daily market updates',
      'Priority email & chat support',
      'Quarterly strategy sessions'
    ],
    walletAddresses: {
      bitcoin: 'bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58',
      bitcoinCash: 'qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g',
      ethereum: '0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32', // Same address for BNB
      bnb: '0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32',
      usdt: 'THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb'
    }
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    minAmount: 10000,
    maxAmount: 100000,
    returnRate: '12-18% Monthly',
    duration: '12 Months',
    features: [
      'Personalized portfolio management',
      'Real-time market alerts',
      '24/7 dedicated support',
      'Monthly strategy sessions',
      'Tax optimization',
      'Early access to new investment opportunities'
    ],
    walletAddresses: {
      bitcoin: 'bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58',
      bitcoinCash: 'qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g',
      ethereum: '0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32', // Same address for BNB
      bnb: '0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32',
      usdt: 'THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb'
    }
  }
];

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('investment');
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getUserProfile(user?.id),
    enabled: !!user?.id,
    staleTime: 300000 // 5 minutes
  });

  // Function to copy wallet address to clipboard
  const copyToClipboard = (address: string, type: string) => {
    navigator.clipboard.writeText(address);
    setCopiedWallet(`${type}`);
    toast({
      title: 'Address Copied',
      description: 'Wallet address has been copied to clipboard',
    });
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedWallet(null);
    }, 2000);
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Account Settings</CardTitle>
          <CardDescription>Manage your account settings and investment plans</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="investment" onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="investment">
                <Briefcase className="h-4 w-4 mr-2" />
                Investment Plans
              </TabsTrigger>
              <TabsTrigger value="security">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Security Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="investment">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Available Investment Plans</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose an investment plan that suits your financial goals. Send the exact amount to the corresponding wallet address.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {INVESTMENT_PLANS.map((plan) => (
                    <Card key={plan.id} className="border-2 hover:border-primary transition-all duration-200">
                      <CardHeader className="bg-accent/50">
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                          ${plan.minAmount} - ${plan.maxAmount}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">Return Rate:</p>
                            <p className="text-primary">{plan.returnRate}</p>
                          </div>
                          <div>
                            <p className="font-medium">Duration:</p>
                            <p>{plan.duration}</p>
                          </div>
                          <div>
                            <p className="font-medium mb-2">Features:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                              {plan.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="pt-4">
                            <p className="font-medium mb-2">Deposit Addresses:</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Bitcoin:</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(plan.walletAddresses.bitcoin, `${plan.id}-btc`)}
                                >
                                  {copiedWallet === `${plan.id}-btc` ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                                {plan.walletAddresses.bitcoin}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-medium">Bitcoin Cash:</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(plan.walletAddresses.bitcoinCash, `${plan.id}-bch`)}
                                >
                                  {copiedWallet === `${plan.id}-bch` ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                                {plan.walletAddresses.bitcoinCash}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-medium">Ethereum:</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(plan.walletAddresses.ethereum, `${plan.id}-eth`)}
                                >
                                  {copiedWallet === `${plan.id}-eth` ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                                {plan.walletAddresses.ethereum}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-medium">BNB (BSC):</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(plan.walletAddresses.bnb, `${plan.id}-bnb`)}
                                >
                                  {copiedWallet === `${plan.id}-bnb` ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                                {plan.walletAddresses.bnb}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-medium">USDT (TRC20):</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(plan.walletAddresses.usdt, `${plan.id}-usdt`)}
                                >
                                  {copiedWallet === `${plan.id}-usdt` ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                                {plan.walletAddresses.usdt}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="bg-muted p-4 rounded-md mt-6">
                  <h4 className="font-medium flex items-center">
                    <Wallet className="h-4 w-4 mr-2" />
                    Important Information
                  </h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Send only the cryptocurrency specified for each address.</li>
                    <li>The amount sent must be within the plan's range to qualify for that plan.</li>
                    <li>Your investment will be credited to your account after network confirmation.</li>
                    <li>Please contact support if you have any issues with your deposit.</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Security Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your account security settings and preferences.
                </p>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                        </div>
                        <Button variant="outline">Enable 2FA</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Transaction Confirmations</h4>
                          <p className="text-sm text-muted-foreground">Require email confirmation for all transactions</p>
                        </div>
                        <Button variant="outline">Enable</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
