import { UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

// Debounce hook for search inputs
export const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: any[]) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
};

// Standard query configurations for admin panel
export const adminQueryConfig = {
  // For frequently changing data like transactions, deposits
  highFrequency: {
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes('Rate limit exceeded') || error?.message?.includes('429')) {
        return false;
      }
      return failureCount < 2;
    },
  },

  // For moderately changing data like stats, user counts
  mediumFrequency: {
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes('Rate limit exceeded') || error?.message?.includes('429')) {
        return false;
      }
      return failureCount < 2;
    },
  },

  // For slowly changing data like settings, maintenance info
  lowFrequency: {
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes('Rate limit exceeded') || error?.message?.includes('429')) {
        return false;
      }
      return failureCount < 2;
    },
  },

  // For static or rarely changing data
  static: {
    staleTime: 300000, // 5 minutes
    refetchInterval: false,
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes('Rate limit exceeded') || error?.message?.includes('429')) {
        return false;
      }
      return failureCount < 1;
    },
  },
};

// Error handler for admin queries
export const handleAdminQueryError = (error: any, toast: any) => {
  console.error('Admin query error:', error);
  
  let errorMessage = "An error occurred. Please try again.";
  
  if (error?.message?.includes('Rate limit exceeded')) {
    errorMessage = error.message;
  } else if (error?.message?.includes('429')) {
    errorMessage = "Too many requests. Please wait a moment before refreshing.";
  } else if (error?.status === 401) {
    errorMessage = "Your session has expired. Please log in again.";
  } else if (error?.status === 403) {
    errorMessage = "You don't have permission to perform this action.";
  } else if (error?.message) {
    errorMessage = error.message;
  }
  
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive"
  });
};
