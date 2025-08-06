import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  RefreshCw,
  Send,
  Wallet,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface DepositDetails {
  amount: string;
  selectedPlan: string;
  selectedMethod: string;
  walletAddress: string;
  planName: string;
}

// API function for submitting deposit confirmation
const submitDepositConfirmation = async (
  userId: number,
  confirmationData: any
) => {
  console.log("🔍 Submitting deposit confirmation for user:", userId);
  console.log("📦 Confirmation data:", confirmationData);

  try {
    const response = await fetch("/api/transactions/deposit/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        userId,
        ...confirmationData,
      }),
    });

    console.log("📡 Response status:", response.status);
    console.log(
      "📡 Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage;
      let errorData;
      try {
        const responseText = await response.text();
        console.log("❌ Raw error response:", responseText);

        // Try to parse as JSON first
        try {
          errorData = JSON.parse(responseText);
          errorMessage = errorData.message;
          console.log("❌ Parsed error data:", errorData);
        } catch (jsonError) {
          // If not JSON, it might be HTML - extract useful info
          console.log("❌ Response is not JSON, might be HTML");
          errorMessage = `Server returned HTML instead of JSON (status: ${response.status})`;

          // Try to extract title or error message from HTML
          const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) {
            console.log("❌ HTML title found:", titleMatch[1]);
            errorMessage += ` - ${titleMatch[1]}`;
          }
        }
      } catch (e) {
        errorMessage = `Request failed with status: ${response.status}`;
        console.log("❌ Failed to read error response:", e);
      }

      // Handle specific error status codes
      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (response.status === 403) {
        throw new Error("Access denied. Please verify your account.");
      } else if (response.status === 404) {
        throw new Error("API endpoint not found. Please contact support.");
      }

      throw new Error(
        errorMessage || `Request failed with status: ${response.status}`
      );
    }

    // Parse successful response
    try {
      const result = await response.json();
      console.log("✅ Success response:", result);
      return result;
    } catch (parseError) {
      console.log("❌ Failed to parse success response as JSON:", parseError);
      const responseText = await response.text();
      console.log("❌ Raw success response:", responseText);
      throw new Error("Server returned invalid JSON response");
    }
  } catch (error: any) {
    console.log("💥 API call error:", error);
    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
    throw error;
  }
};

const NewDepositConfirmation: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [transactionHash, setTransactionHash] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Get deposit details from localStorage
  const depositDetailsString = localStorage.getItem("depositDetails");
  const depositDetails: DepositDetails | null = depositDetailsString
    ? JSON.parse(depositDetailsString)
    : null;

  // Redirect if no deposit details
  useEffect(() => {
    if (!depositDetails) {
      setLocation("/client/deposit");
    }
  }, [depositDetails, setLocation]);

  // Submit confirmation mutation
  const confirmationMutation = useMutation({
    mutationFn: async (data: {
      transactionHash: string;
      depositDetails: DepositDetails;
    }) => {
      console.log("🚀 Starting deposit confirmation mutation");
      console.log("👤 Current user:", user);
      console.log("💾 Deposit details:", data.depositDetails);
      console.log("🔗 Transaction hash:", data.transactionHash);

      // Ensure user is authenticated
      if (!user?.id) {
        console.log("❌ No user ID available");
        throw new Error("User not authenticated. Please log in again.");
      }

      const payload = {
        transactionHash: data.transactionHash,
        amount: data.depositDetails.amount,
        selectedPlan: data.depositDetails.selectedPlan,
        selectedMethod: data.depositDetails.selectedMethod,
        walletAddress: data.depositDetails.walletAddress,
        planName: data.depositDetails.planName,
      };

      console.log("📦 Final payload:", payload);
      return await submitDepositConfirmation(user.id, payload);
    },
    onSuccess: (data) => {
      // Store thank you data in localStorage for the dashboard thank you message
      const thankYouData = {
        transactionId: data.transactionId || Date.now(),
        amount: depositDetails?.amount || "0",
        crypto: depositDetails?.selectedMethod || "bitcoin",
        transactionHash: transactionHash,
        planName: depositDetails?.planName || "Investment Plan",
        timestamp: Date.now(),
      };
      localStorage.setItem("depositThankYou", JSON.stringify(thankYouData));

      // Clear deposit details from localStorage
      localStorage.removeItem("depositDetails");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["userBalance", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["userTransactions", user?.id],
      });

      // Show success toast
      toast({
        title: "Deposit Submitted Successfully! 🎉",
        description:
          "Your deposit confirmation has been submitted for admin review. Thank you!",
      });

      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/client/dashboard");
      }, 1500);
    },
    onError: (error: any) => {
      // Handle authentication errors specifically
      if (
        error.message.includes("Authentication failed") ||
        error.message.includes("log in again")
      ) {
        // Clear localStorage and redirect to login
        localStorage.removeItem("user");
        localStorage.removeItem("depositDetails");
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
        return;
      }

      toast({
        title: "Submission Failed",
        description:
          error.message ||
          "There was an error submitting your deposit confirmation.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionHash.trim()) {
      toast({
        title: "Transaction Hash Required",
        description: "Please enter your transaction hash.",
        variant: "destructive",
      });
      return;
    }

    if (!depositDetails) {
      toast({
        title: "Invalid Deposit",
        description: "Deposit details not found. Please start a new deposit.",
        variant: "destructive",
      });
      return;
    }

    confirmationMutation.mutate({
      transactionHash: transactionHash.trim(),
      depositDetails,
    });
  };

  const handleCopyAddress = async () => {
    if (depositDetails?.walletAddress) {
      try {
        await navigator.clipboard.writeText(depositDetails.walletAddress);
        setCopiedAddress(true);
        toast({
          title: "Address Copied",
          description: "Wallet address copied to clipboard.",
        });
        setTimeout(() => setCopiedAddress(false), 3000);
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy address to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleGoBack = () => {
    setLocation("/client/deposit");
  };

  if (!depositDetails) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Deposit Details Found
            </h3>
            <p className="text-gray-500 mb-4">
              Please start a new deposit process.
            </p>
            <Button onClick={() => setLocation("/client/deposit")}>
              Go to Deposit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deposit
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          Confirm Your Deposit
        </h1>
        <p className="text-gray-600 mt-2">
          Please send the payment and submit your transaction hash for
          verification.
        </p>
      </div>

      {/* Deposit Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Deposit Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Investment Plan</p>
                <p className="font-semibold">{depositDetails.planName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-semibold text-green-600">
                  ${depositDetails.amount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-semibold capitalize">
                  {depositDetails.selectedMethod}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Awaiting Payment
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Instructions:</p>
                  <ul className="space-y-1 text-xs">
                    <li>
                      1. Send exactly <strong>${depositDetails.amount}</strong>{" "}
                      to the wallet address below
                    </li>
                    <li>
                      2. Use the{" "}
                      <strong>
                        {depositDetails.selectedMethod.toUpperCase()}
                      </strong>{" "}
                      network only
                    </li>
                    <li>3. Copy the transaction hash after sending</li>
                    <li>
                      4. Submit the transaction hash below for verification
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">
                {depositDetails.selectedMethod.toUpperCase()} Wallet Address
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={depositDetails.walletAddress}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyAddress}
                  className="shrink-0"
                >
                  {copiedAddress ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Send only{" "}
                {depositDetails.selectedMethod.toUpperCase()} to this address.
                Sending any other cryptocurrency will result in permanent loss
                of funds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Hash Submission */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Transaction Hash</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitConfirmation} className="space-y-6">
            <div>
              <Label htmlFor="transactionHash">Transaction Hash / TXID</Label>
              <Input
                id="transactionHash"
                placeholder="Enter your transaction hash"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                You can find this in your wallet after sending the payment
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">After Submission:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Your deposit will be reviewed by our admin team</li>
                    <li>• Verification typically takes 1-24 hours</li>
                    <li>• You'll receive a notification once approved</li>
                    <li>• Funds will be credited to your account balance</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={
                !transactionHash.trim() ||
                confirmationMutation.status === "pending"
              }
            >
              {confirmationMutation.status === "pending" ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>

            {confirmationMutation.isSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    Deposit confirmation submitted successfully! Redirecting to
                    dashboard...
                  </p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewDepositConfirmation;
