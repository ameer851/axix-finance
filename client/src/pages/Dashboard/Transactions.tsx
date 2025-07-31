import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Transaction, TransactionType, InsertTransaction } from '@shared/schema';
import { getUserTransactions } from '@/services/userService';
import { createTransaction, getTransactionTypeLabel } from '@/services/transactionService';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDate, getTransactionTypeColor, getStatusColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  PieChart,
  Plus,
  ExternalLink
} from 'lucide-react';

const transactionFormSchema = z.object({
  type: z.enum(['deposit', 'withdrawal', 'transfer', 'investment']),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: [`/users/${user?.id}/transactions`],
    enabled: !!user,
  });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'deposit',
      amount: '',
      description: '',
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: TransactionFormValues) => {
      if (!user) throw new Error('User not authenticated');
      
      const transaction: InsertTransaction = {
        userId: user.id,
        type: data.type as TransactionType,
        amount: data.amount,
        description: data.description || '',
        status: 'pending',
      };

      return createTransaction(transaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/users/${user?.id}/transactions`] });
      toast({
        title: 'Transaction created',
        description: 'Your transaction has been submitted and is pending approval.',
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create transaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TransactionFormValues) => {
    // Check for withdrawal/investment exceeding balance
    if ((data.type === 'withdrawal' || data.type === 'investment') && user) {
      const amount = parseFloat(data.amount);
      const balance = parseFloat(user.balance as string);
      
      if (amount > balance) {
        toast({
          title: 'Insufficient balance',
          description: `Your current balance $${balance.toFixed(2)} is less than the requested amount $${amount.toFixed(2)}.`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    createTransactionMutation.mutate(data);
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowDown className="h-5 w-5" />;
      case 'withdrawal':
        return <ArrowUp className="h-5 w-5" />;
      case 'transfer':
        return <ArrowLeftRight className="h-5 w-5" />;
      case 'investment':
        return <PieChart className="h-5 w-5" />;
      default:
        return <ArrowLeftRight className="h-5 w-5" />;
    }
  };

  const columns = [
    {
      header: 'Transaction',
      accessorKey: 'type',
      cell: (transaction: Transaction) => {
        const colors = getTransactionTypeColor(transaction.type);
        return (
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${colors.bgClass} ${colors.textClass}`}>
              {getTransactionIcon(transaction.type as TransactionType)}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {getTransactionTypeLabel(transaction.type as TransactionType)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {transaction.description || `${transaction.type} transaction`}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (transaction: Transaction) => {
        const date = new Date(transaction.createdAt);
        return (
          <div>
            <div className="text-sm text-gray-900 dark:text-white">{formatDate(date)}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{date.toLocaleTimeString()}</div>
          </div>
        );
      }
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (transaction: Transaction) => {
        const isNegative = transaction.type === 'withdrawal' || transaction.type === 'investment';
        const prefix = isNegative ? '-' : '+';
        const className = isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
        
        return (
          <div className={`text-sm font-medium ${className}`}>
            {transaction.type === 'transfer' ? '' : prefix}{formatCurrency(transaction.amount as string)}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (transaction: Transaction) => {
        const { bgClass, textClass } = getStatusColor(transaction.status);
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgClass} ${textClass}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        );
      }
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Transactions</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
              <DialogDescription>
                Submit a new transaction request. It will be processed shortly.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdrawal">Withdrawal</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the type of transaction you want to perform.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            {...field}
                            placeholder="0.00"
                            className="pl-8"
                            type="number"
                            step="0.01"
                            min="0.01"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the amount for this transaction.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Additional details about this transaction"
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createTransactionMutation.isPending}>
                    {createTransactionMutation.isPending ? 'Submitting...' : 'Submit Transaction'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View all your past and pending transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions || []}
            loading={isLoading}
            actions={(row) => (
              <Button variant="outline" size="sm" className="flex items-center">
                <span className="mr-1">Details</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;

