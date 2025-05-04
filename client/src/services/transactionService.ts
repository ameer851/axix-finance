import { Transaction, InsertTransaction, TransactionType, TransactionStatus } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export async function createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
  try {
    const response = await apiRequest('POST', '/api/transactions', transactionData);
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create transaction');
  }
}

export async function getTransaction(transactionId: number): Promise<Transaction> {
  try {
    const response = await apiRequest('GET', `/api/transactions/${transactionId}`);
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch transaction details');
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const response = await apiRequest('GET', '/api/transactions');
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch transactions');
  }
}

export async function getPendingTransactions(): Promise<Transaction[]> {
  try {
    const response = await apiRequest('GET', '/api/transactions/pending');
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch pending transactions');
  }
}

export async function updateTransactionStatus(
  transactionId: number, 
  status: TransactionStatus
): Promise<Transaction> {
  try {
    const response = await apiRequest('PATCH', `/api/transactions/${transactionId}/status`, { status });
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || `Failed to update transaction status to ${status}`);
  }
}

export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer: 'Transfer',
    investment: 'Investment'
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

export function getTransactionStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    pending: 'Pending',
    completed: 'Completed',
    rejected: 'Rejected'
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

export function getTransactionDescription(type: TransactionType): string {
  const descriptions: Record<TransactionType, string> = {
    deposit: 'Bank transfer',
    withdrawal: 'To external wallet',
    transfer: 'To savings account',
    investment: 'Stock purchase'
  };
  return descriptions[type] || `${type} transaction`;
}
