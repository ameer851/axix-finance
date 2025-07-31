import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock,
  DollarSign,
  ArrowRight,
  Home,
  MessageCircle
} from 'lucide-react';

interface ThankYouState {
  transactionId: number;
  amount: string;
  crypto: string;
}

const DepositThankYou: React.FC = () => {
  const [location, navigate] = useLocation();
  
  // Get thank you data from localStorage
  const thankYouDataString = localStorage.getItem('thankYouData');
  const state = thankYouDataString ? JSON.parse(thankYouDataString) : null;
  
  // Redirect if no state
  React.useEffect(() => {
    if (!state) {
      navigate('/dashboard');
    } else {
      // Clear the data after using it
      localStorage.removeItem('thankYouData');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const getCryptoName = (crypto: string) => {
    const cryptoNames: { [key: string]: string } = {
      bitcoin: 'Bitcoin (BTC)',
      bitcoinCash: 'Bitcoin Cash (BCH)',
      ethereum: 'Ethereum (ETH)',
      bnb: 'BNB (BSC)',
      usdt: 'USDT (TRC20)'
    };
    return cryptoNames[crypto] || crypto;
  };

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-3xl text-green-600">
            Deposit Submitted Successfully!
          </CardTitle>
          <CardDescription className="text-lg">
            Thank you for your deposit. Your transaction is now being processed.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-2">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-gray-900">${state.amount}</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                  <span className="text-blue-600 font-bold text-sm">
                    {getCryptoName(state.crypto).split(' ')[0].charAt(0)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Cryptocurrency</p>
                <p className="font-semibold text-gray-900">{getCryptoName(state.crypto)}</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                  <span className="text-purple-600 font-bold text-sm">#</span>
                </div>
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="font-semibold text-gray-900">#{state.transactionId}</p>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">What Happens Next?</h3>
            </div>
            
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-blue-900">Transaction Verification</p>
                  <p className="text-sm text-blue-700">Our team will verify your transaction hash on the blockchain</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-blue-900">Admin Approval</p>
                  <p className="text-sm text-blue-700">An administrator will review and approve your deposit</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-blue-900">Account Credit</p>
                  <p className="text-sm text-blue-700">Your account balance will be updated and investment will begin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Timeline */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-center text-amber-800">
              <strong>Expected Processing Time:</strong> 1-24 hours
            </p>
            <p className="text-center text-sm text-amber-700 mt-1">
              You will receive a notification once your deposit is approved
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/history')}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              View Transactions
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/support')}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>

          {/* Important Note */}
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-gray-900 mb-2">Important:</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Keep this transaction ID for your records: <strong>#{state.transactionId}</strong></li>
              <li>You can check your transaction status in the Transactions page</li>
              <li>Contact support if you don't receive confirmation within 24 hours</li>
              <li>Your investment will start earning returns once approved</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositThankYou;
