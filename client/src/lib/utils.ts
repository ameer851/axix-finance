import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export function getTransactionTypeColor(type: string): {bgClass: string, textClass: string, iconBgClass: string} {
  switch(type) {
    case 'deposit':
      return {
        bgClass: 'bg-green-100 dark:bg-green-900',
        textClass: 'text-green-800 dark:text-green-200',
        iconBgClass: 'bg-green-500'
      };
    case 'withdrawal':
      return {
        bgClass: 'bg-red-100 dark:bg-red-900',
        textClass: 'text-red-800 dark:text-red-200',
        iconBgClass: 'bg-red-500'
      };
    case 'transfer':
      return {
        bgClass: 'bg-yellow-100 dark:bg-yellow-900',
        textClass: 'text-yellow-800 dark:text-yellow-200',
        iconBgClass: 'bg-yellow-500'
      };
    case 'investment':
      return {
        bgClass: 'bg-blue-100 dark:bg-blue-900',
        textClass: 'text-blue-800 dark:text-blue-200',
        iconBgClass: 'bg-blue-500'
      };
    default:
      return {
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-800 dark:text-gray-200',
        iconBgClass: 'bg-gray-500'
      };
  }
}

export function getStatusColor(status: string): {bgClass: string, textClass: string} {
  switch(status) {
    case 'completed':
      return {
        bgClass: 'bg-green-100 dark:bg-green-900',
        textClass: 'text-green-800 dark:text-green-200'
      };
    case 'pending':
      return {
        bgClass: 'bg-yellow-100 dark:bg-yellow-900',
        textClass: 'text-yellow-800 dark:text-yellow-200'
      };
    case 'rejected':
      return {
        bgClass: 'bg-red-100 dark:bg-red-900',
        textClass: 'text-red-800 dark:text-red-200'
      };
    default:
      return {
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-800 dark:text-gray-200'
      };
  }
}
