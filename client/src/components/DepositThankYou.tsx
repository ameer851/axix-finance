import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Clock, Sparkles, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ThankYouData {
  transactionId: string | number;
  amount: string;
  crypto: string;
  transactionHash: string;
  planName: string;
  timestamp: number;
}

const DepositThankYou: React.FC = () => {
  const [thankYouData, setThankYouData] = useState<ThankYouData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for thank you data in localStorage
    const storedData = localStorage.getItem("depositThankYou");
    if (storedData) {
      try {
        const data: ThankYouData = JSON.parse(storedData);

        // Check if the thank you message is recent (within last 5 minutes)
        const now = Date.now();
        const timeDiff = now - data.timestamp;
        const fiveMinutes = 5 * 60 * 1000;

        if (timeDiff < fiveMinutes) {
          setThankYouData(data);
          setIsVisible(true);
        } else {
          // Remove old thank you data
          localStorage.removeItem("depositThankYou");
        }
      } catch (error) {
        console.error("Error parsing thank you data:", error);
        localStorage.removeItem("depositThankYou");
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.removeItem("depositThankYou");
  };

  if (!isVisible || !thankYouData) {
    return null;
  }

  return (
    <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-green-800">
                  Thank You for Your Deposit!
                </h3>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>

              <p className="text-green-700 mb-4">
                Your deposit has been successfully submitted and is now under
                review by our admin team.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Transaction ID:
                    </span>
                    <span className="text-sm font-mono text-gray-800">
                      #{thankYouData.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-semibold text-green-600">
                      ${thankYouData.amount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Investment Plan:
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {thankYouData.planName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Payment Method:
                    </span>
                    <span className="text-sm font-medium text-gray-800 uppercase">
                      {thankYouData.crypto}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Transaction Hash:
                    </span>
                    <span
                      className="text-xs font-mono text-gray-700 max-w-32 truncate"
                      title={thankYouData.transactionHash}
                    >
                      {thankYouData.transactionHash}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Our admin team will verify your transaction</li>
                      <li>• Verification typically takes 1-24 hours</li>
                      <li>
                        • You'll receive an email notification once approved
                      </li>
                      <li>• Funds will be credited to your account balance</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-green-700">
                <ArrowRight className="h-4 w-4" />
                <span>Your investment journey is about to begin!</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepositThankYou;
