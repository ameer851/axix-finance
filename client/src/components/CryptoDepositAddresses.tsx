import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Bitcoin,
  Copy,
  Check,
  CreditCard,
  LayoutGrid
} from 'lucide-react';

const CryptoDepositAddresses: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Investment Cryptocurrency Addresses</CardTitle>
        <CardDescription>Send funds to these addresses to start your investment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            To start your investment, send the amount you wish to invest to one of our cryptocurrency wallets below. 
            After sending funds, please contact support with your transaction ID for faster processing.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bitcoin Address */}
            <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3">
                <Bitcoin className="h-6 w-6 mr-2 text-amber-500" />
                <h3 className="text-md font-semibold">Bitcoin (BTC)</h3>
              </div>
              <div className="flex items-center p-2 bg-gray-100 dark:bg-neutral-800 rounded-md">
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 break-all">
                  bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58
                </p>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCopy("bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58", "btc")}
                  className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                >
                  {copiedText === "btc" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Bitcoin Cash Address */}
            <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3">
                <Bitcoin className="h-6 w-6 mr-2 text-green-500" />
                <h3 className="text-md font-semibold">Bitcoin Cash (BCH)</h3>
              </div>
              <div className="flex items-center p-2 bg-gray-100 dark:bg-neutral-800 rounded-md">
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 break-all">
                  qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g
                </p>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCopy("qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g", "bch")}
                  className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                >
                  {copiedText === "bch" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Ethereum Address */}
            <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3">
                <LayoutGrid className="h-6 w-6 mr-2 text-blue-500" />
                <h3 className="text-md font-semibold">Ethereum (ETH)</h3>
              </div>
              <div className="flex items-center p-2 bg-gray-100 dark:bg-neutral-800 rounded-md">
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 break-all">
                  0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32
                </p>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCopy("0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32", "eth")}
                  className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                >
                  {copiedText === "eth" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* USDT TRC20 Address */}
            <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3">
                <CreditCard className="h-6 w-6 mr-2 text-green-600" />
                <h3 className="text-md font-semibold">USDT (TRC20)</h3>
              </div>
              <div className="flex items-center p-2 bg-gray-100 dark:bg-neutral-800 rounded-md">
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 break-all">
                  THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb
                </p>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCopy("THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb", "usdt")}
                  className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                >
                  {copiedText === "usdt" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* BNB Address */}
            <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700 md:col-span-2">
              <div className="flex items-center mb-3">
                <LayoutGrid className="h-6 w-6 mr-2 text-yellow-500" />
                <h3 className="text-md font-semibold">BNB (BEP20)</h3>
              </div>
              <div className="flex items-center p-2 bg-gray-100 dark:bg-neutral-800 rounded-md">
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 break-all">
                  0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32
                </p>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCopy("0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32", "bnb")}
                  className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                >
                  {copiedText === "bnb" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Important Notice</h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  <p>
                    Please verify the cryptocurrency network (chain) before sending funds. Sending funds through the 
                    wrong network may result in loss of funds. After making a deposit, please allow 1-3 network 
                    confirmations for the funds to be credited to your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoDepositAddresses;