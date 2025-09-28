import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile } from "@/services/userService";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import React, { useState } from "react";

// Define investment plans with real wallet addresses
const INVESTMENT_PLANS = [
  {
    id: "starter",
    name: "STARTER PLAN",
    minAmount: 50,
    maxAmount: 999,
    returnRate: "2% daily for 3 days",
    duration: "3 Days",
    features: [
      "Principal Included",
      "10% Referral Commission",
      "Quick 3-day Investment Cycle",
      "Secure Investment Platform",
      "Daily Returns Directly to Your Account",
    ],
    walletAddresses: {
      bitcoin: "1AP9zBW4AtFJU4jBpBNfZRbcgLp3KLDdFP",
      bitcoinCash: "qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g",
      ethereum: "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32",
      bnb: "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32",
      usdt: "THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb",
    },
  },
  {
    id: "premium",
    name: "PREMIUM PLAN",
    minAmount: 1000,
    maxAmount: 4999,
    returnRate: "3.5% daily for 7 days",
    duration: "7 Days",
    features: [
      "Principal Included",
      "10% Referral Commission",
      "Extended 7-day Investment Cycle",
      "Priority Customer Support",
      "Higher Daily Percentage Returns",
    ],
    walletAddresses: {
      bitcoin: "1AP9zBW4AtFJU4jBpBNfZRbcgLp3KLDdFP",
      bitcoinCash: "qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g",
      ethereum: "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32",
      bnb: "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32",
      usdt: "THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb",
    },
  },
  {
    id: "deluxe",
    name: "DELUX PLAN",
    minAmount: 5000,
    maxAmount: 19999,
    returnRate: "5% daily for 10 days",
    duration: "10 Days",
    features: [
      "Principal Included",
      "10% Referral Commission",
      "Premium 10-day Investment Cycle",
      "VIP Customer Support",
      "Superior Daily Percentage Returns",
    ],
    walletAddresses: {
      bitcoin: "1AP9zBW4AtFJU4jBpBNfZRbcgLp3KLDdFP",
      bitcoinCash: "qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g",
      ethereum: "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32",
      bnb: "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32",
      usdt: "THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb",
    },
  },
  {
    id: "luxury",
    name: "LUXURY PLAN",
    minAmount: 20000,
    maxAmount: Infinity,
    returnRate: "7.5% daily for 30 days",
    duration: "30 Days",
    features: [
      "Principal Included",
      "10% Referral Commission",
      "Extended 30-day Investment Cycle",
      "Dedicated Account Manager",
      "Maximum Daily Returns",
    ],
    walletAddresses: {
      bitcoin: "1AP9zBW4AtFJU4jBpBNfZRbcgLp3KLDdFP",
      bitcoinCash: "qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g",
      ethereum: "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32",
      bnb: "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32",
      usdt: "THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb",
    },
  },
];

const InvestmentPlans: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getUserProfile(user?.id),
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  // Function to copy wallet address to clipboard
  const copyToClipboard = (address: string, type: string) => {
    navigator.clipboard.writeText(address);
    setCopiedWallet(`${type}`);
    toast({
      title: "Address Copied",
      description: "Wallet address has been copied to clipboard",
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
          <CardTitle className="text-2xl">Investment Plans</CardTitle>
          <CardDescription>
            Choose an investment plan that suits your financial goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INVESTMENT_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className="border-2 hover:border-primary transition-all duration-200"
              >
                <CardHeader className="bg-accent/50">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    ${plan.minAmount} - $
                    {plan.maxAmount === Infinity ? "Unlimited" : plan.maxAmount}
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
                        {Object.entries(plan.walletAddresses).map(
                          ([crypto, address]) => (
                            <div
                              key={crypto}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm font-medium">
                                {crypto.charAt(0).toUpperCase() +
                                  crypto.slice(1)}
                                :
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(
                                    address,
                                    `${plan.id}-${crypto}`
                                  )
                                }
                              >
                                {copiedWallet === `${plan.id}-${crypto}` ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentPlans;
