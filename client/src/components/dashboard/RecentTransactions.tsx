import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowLeftRight, 
  DollarSign, 
  Calendar, 
  Filter,
  Download,
  ChevronRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction } from '@shared/schema';
import { getTransactions } from '@/services/transactionService';

interface RecentTransactionsProps {
  limit?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  limit = 5,
  showViewAll = true,
  onViewAll
}) => {
  const { user } = useAuth();
  
  // Fetch transactions data
  const { data: transactionsData = { transactions: [], total: 0 }, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      try {
        // Fetch real transaction data from the API
        const userId = user?.id;
        if (!userId) throw new Error("User ID is required");
        
        const response = await getTransactions({
          userId: Number(userId),
          limit: limit,
          page: 1,
          sortBy: 'createdAt',
          order: 'desc'
        });
        
        return response;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });
  
  // Format currency
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case 'investment':
        return <ArrowDown className="h-4 w-4 text-blue-500" />;
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-orange-500" />;
      default:
        return <ArrowLeftRight className="h-4 w-4" />;
    }
  };
  
  // Get transaction badge based on type
  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Deposit</Badge>;
      case 'withdrawal':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Withdraw</Badge>;
      case 'investment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Investment</Badge>;
      case 'transfer':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Transfer</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };
  
  // Get transaction amount class based on type
  const getAmountClass = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'transfer':
        return 'text-green-600';
      case 'withdrawal':
      case 'investment':
        return 'text-red-600';
      default:
        return '';
    }
  };
  
  // Get transaction amount prefix based on type
  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'transfer':
        return '+';
      case 'withdrawal':
      case 'investment':
        return '-';
      default:
        return '';
    }
  };
  
  if (transactionsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Loading your transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const transactions = transactionsData.transactions || [];
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your recent financial activities</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No transactions found</p>
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Make your first transaction
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        {getTransactionBadge(transaction.type)}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.description || '—'}</TableCell>
                    <TableCell>{transaction.createdAt ? formatDate(typeof transaction.createdAt === 'string' ? transaction.createdAt : transaction.createdAt.toISOString()) : '—'}</TableCell>
                    <TableCell className={`text-right ${getAmountClass(transaction.type)}`}>
                      {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {showViewAll && transactions.length > limit && (
              <div className="flex justify-center mt-4">
                <Button variant="ghost" onClick={onViewAll}>
                  View All Transactions
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
