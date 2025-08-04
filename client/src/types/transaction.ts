export interface Transaction {
  id: number;
  userId: number;
  type: "deposit" | "withdrawal" | "transfer" | "investment";
  amount: string;
  description?: string;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
  updatedAt: string;
  processedBy?: number;
  rejectionReason?: string;
  transactionHash?: string;
  cryptoType?: string;
  walletAddress?: string;
  planName?: string;
  planDuration?: string;
  dailyProfit?: string;
  totalReturn?: string;
  expectedCompletionDate?: string;
}
