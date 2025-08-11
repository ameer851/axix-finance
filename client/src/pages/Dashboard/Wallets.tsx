import TransactionFilter, {
  FilterOptions,
} from "@/components/TransactionFilter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import { Transaction } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Bitcoin,
  Check,
  Copy,
  CreditCard,
  LayoutGrid,
  Wallet,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const Wallets: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<
    "deposit" | "withdraw" | null
  >(null);

  // Fetch user transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: [`/users/${userId}/transactions`],
    enabled: !!userId,
  });

  // This would be fetched from an API in a real implementation
  // For now, let's use a sample wallet address
  const walletAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedText(walletAddress);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getTransactionsByType = (type: "deposit" | "withdrawal") => {
    if (!transactions) return [];
    return transactions.filter((t) => t.type === type);
  };

  const deposits = getTransactionsByType("deposit");
  const withdrawals = getTransactionsByType("withdrawal");

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">Loading wallet data...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Wallets
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Main Wallet Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Main Wallet</CardTitle>
                <CardDescription>
                  Your primary investment wallet
                </CardDescription>
              </div>
              <Wallet className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current Balance
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${user?.balance || "0.00"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Wallet Address
                </p>
                <div className="flex items-center p-3 bg-gray-100 dark:bg-neutral-700 rounded-md">
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 truncate">
                    {walletAddress}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyAddress}
                    className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-600"
                  >
                    {copiedText === walletAddress ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Dialog
              open={activeDialog === "deposit"}
              onOpenChange={(open) => setActiveDialog(open ? "deposit" : null)}
            >
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 flex-1 mr-2">
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                  <DialogDescription>
                    Use the following details to deposit funds to your wallet.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <div className="flex items-center p-3 bg-gray-100 dark:bg-neutral-700 rounded-md">
                      <p className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 truncate">
                        {walletAddress}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyAddress}
                        className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-600"
                      >
                        {copiedText === walletAddress ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Network</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Ethereum (ERC20)
                    </p>
                  </div>
                  <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-4 mt-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle
                          className="h-5 w-5 text-amber-400"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Important Note
                        </h3>
                        <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                          <p>
                            After making your deposit, please allow up to 30
                            minutes for the funds to be credited to your
                            account. Contact our support team if your deposit
                            has not been reflected after this time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={activeDialog === "withdraw"}
              onOpenChange={(open) => setActiveDialog(open ? "withdraw" : null)}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 ml-2">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Enter the amount and destination address to withdraw your
                    funds.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      placeholder="0.00"
                      type="number"
                      min="50"
                      max={user?.balance || "0"}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Available Balance: ${user?.balance || "0.00"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wallet-address">Wallet Address</Label>
                    <Input
                      id="wallet-address"
                      placeholder="Enter destination wallet address"
                    />
                  </div>
                  <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-4 mt-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle
                          className="h-5 w-5 text-amber-400"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Important Note
                        </h3>
                        <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                          <p>
                            Please verify your withdrawal address carefully.
                            Withdrawals are typically processed within 24 hours.
                            Minimum withdrawal amount is $50.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Submit Withdrawal Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Stats</CardTitle>
            <CardDescription>Transaction summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Deposits
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                $
                {deposits
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Withdrawals
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                $
                {withdrawals
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pending Transactions
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {transactions?.filter((t) => t.status === "pending").length ||
                  0}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last Transaction
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {(() => {
                  if (!transactions || transactions.length === 0) return "None";
                  const raw = transactions[transactions.length - 1]?.createdAt;
                  if (!raw) return "None";
                  const date =
                    raw instanceof Date
                      ? raw
                      : new Date(typeof raw === "string" ? raw : String(raw));
                  return isNaN(date.getTime()) ? "Invalid" : formatDate(date);
                })()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cryptocurrency Deposit Addresses */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cryptocurrency Deposit Addresses</CardTitle>
          <CardDescription>
            Send funds to these addresses to make deposits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To make a deposit, send the amount you wish to invest to one of
              our cryptocurrency wallets below. After sending funds, please
              contact support with your transaction ID for faster processing.
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
                    onClick={() => {
                      navigator.clipboard.writeText(
                        "bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58"
                      );
                      setCopiedText(
                        "bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58"
                      );
                      setTimeout(() => setCopiedText(null), 2000);
                    }}
                    className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  >
                    {copiedText ===
                    "bc1qs0ftgvepn2e6an0cam5ng8wz8g8exsnmupwu58" ? (
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
                    onClick={() => {
                      navigator.clipboard.writeText(
                        "qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g"
                      );
                      setCopiedText(
                        "qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g"
                      );
                      setTimeout(() => setCopiedText(null), 2000);
                    }}
                    className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  >
                    {copiedText ===
                    "qpnej2mh5wh68qhqps8hych9mecpmw3rvgkznv0v0g" ? (
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
                    onClick={() => {
                      navigator.clipboard.writeText(
                        "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32"
                      );
                      setCopiedText(
                        "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32"
                      );
                      setTimeout(() => setCopiedText(null), 2000);
                    }}
                    className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  >
                    {copiedText ===
                    "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32" ? (
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
                    onClick={() => {
                      navigator.clipboard.writeText(
                        "THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb"
                      );
                      setCopiedText("THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb");
                      setTimeout(() => setCopiedText(null), 2000);
                    }}
                    className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  >
                    {copiedText === "THpFyXdC93QvnM8DJUeLmEVjq2hsFpULWb" ? (
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
                    onClick={() => {
                      navigator.clipboard.writeText(
                        "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32"
                      );
                      setCopiedText(
                        "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32_bnb"
                      );
                      setTimeout(() => setCopiedText(null), 2000);
                    }}
                    className="ml-2 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  >
                    {copiedText ===
                    "0xe5fd698fEE63ACf879d6fd127a2b90781256Bb32_bnb" ? (
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
                  <AlertCircle
                    className="h-5 w-5 text-amber-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Important Notice
                  </h3>
                  <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    <p>
                      Please verify the cryptocurrency network (chain) before
                      sending funds. Sending funds through the wrong network may
                      result in loss of funds. After making a deposit, please
                      allow 1-3 network confirmations for the funds to be
                      credited to your account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your wallet's activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-3 w-[400px]">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <TransactionTable transactions={transactions || []} />
            </TabsContent>

            <TabsContent value="deposits" className="mt-4">
              <TransactionTable transactions={deposits} />
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-4">
              <TransactionTable transactions={withdrawals} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for transaction tables

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
}) => {
  const [filteredTransactions, setFilteredTransactions] =
    useState<Transaction[]>(transactions);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  // Apply transaction filters
  const handleFilter = (filters: FilterOptions) => {
    setIsFiltering(true);

    const filtered = transactions.filter((transaction) => {
      // Filter by date range
      if (filters.dateRange.from && transaction.createdAt) {
        const txDate = new Date(transaction.createdAt);
        if (txDate < filters.dateRange.from) {
          return false;
        }
      }

      if (filters.dateRange.to && transaction.createdAt) {
        const txDate = new Date(transaction.createdAt);
        // Add one day to include the end date
        const endDate = new Date(filters.dateRange.to);
        endDate.setDate(endDate.getDate() + 1);

        if (txDate > endDate) {
          return false;
        }
      }

      // Filter by transaction type
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false;
      }

      // Filter by status
      if (filters.status !== "all" && transaction.status !== filters.status) {
        return false;
      }

      // Filter by amount range
      if (
        filters.amount.min &&
        parseFloat(transaction.amount) < parseFloat(filters.amount.min)
      ) {
        return false;
      }

      if (
        filters.amount.max &&
        parseFloat(transaction.amount) > parseFloat(filters.amount.max)
      ) {
        return false;
      }

      // Filter by search text
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const idMatch = transaction.id.toString().includes(searchLower);
        const descMatch =
          transaction.description?.toLowerCase().includes(searchLower) || false;

        if (!idMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });

    setFilteredTransactions(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setIsFiltering(false);
    setFilteredTransactions(transactions);
  };

  // Update filtered transactions when original transactions change
  useEffect(() => {
    if (!isFiltering) {
      setFilteredTransactions(transactions);
    }
  }, [transactions, isFiltering]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No transactions found.
      </div>
    );
  }

  return (
    <>
      <TransactionFilter onFilter={handleFilter} />

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No transactions match your filters.
          <div className="mt-2">
            <Button variant="link" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.type.charAt(0).toUpperCase() +
                    transaction.type.slice(1)}
                </TableCell>
                <TableCell>
                  {transaction.createdAt
                    ? formatDate(new Date(transaction.createdAt))
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      transaction.type === "deposit"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {transaction.type === "deposit" ? "+" : "-"}$
                    {transaction.amount}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${
                        transaction.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                  >
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};

export default Wallets;
