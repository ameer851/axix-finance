import { toast } from '@/hooks/use-toast';

/**
 * Error categories for better tracking and handling
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Interface for structured error handling
 */
export interface AppError extends Error {
  category: ErrorCategory;
  status?: number;
  code?: string;
  isHandled?: boolean;
  originalError?: any;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a structured app error from any error type
 */
export function createAppError(error: any, defaultCategory: ErrorCategory = ErrorCategory.UNKNOWN): AppError {
  // If it's already an AppError, return it
  if (error && error.category && Object.values(ErrorCategory).includes(error.category)) {
    return error as AppError;
  }
  
  // Determine error category based on available information
  let category = defaultCategory;
  let status = error?.status || error?.statusCode;
  let message = error?.message || 'An unexpected error occurred';
  
  // Extract status code to categorize properly
  if (error?.isOffline || error?.isNetworkError || message.includes('network') || message.includes('offline')) {
    category = ErrorCategory.NETWORK;
  } else if (status === 401 || message.includes('unauthorized') || message.includes('unauthenticated')) {
    category = ErrorCategory.AUTHENTICATION;
  } else if (status === 403 || message.includes('forbidden') || message.includes('permission')) {
    category = ErrorCategory.AUTHORIZATION;
  } else if (status === 422 || status === 400 || message.includes('validation') || message.includes('invalid')) {
    category = ErrorCategory.VALIDATION;
  } else if (status && status >= 500) {
    category = ErrorCategory.SERVER;
  } else if (error?.timeout || message.includes('timeout')) {
    category = ErrorCategory.TIMEOUT;
  }
  
  const appError: AppError = new Error(message) as AppError;
  appError.category = category;
  appError.status = status;
  appError.code = error?.code;
  appError.originalError = error;
  appError.timestamp = new Date().toISOString();
  appError.name = 'AppError';
  
  // Copy stack if available
  if (error?.stack) {
    appError.stack = error.stack;
  }
  
  return appError;
}

/**
 * Log error to the console and potentially to an error tracking service
 */
export function logError(error: AppError | any, context: Record<string, any> = {}): void {
  const appError = (error.category) ? error as AppError : createAppError(error);
  
  // Construct richer error context
  const errorContext = {
    ...context,
    category: appError.category,
    status: appError.status,
    code: appError.code,
    url: window.location.href,
    timestamp: appError.timestamp || new Date().toISOString()
  };
  
  // Console log for development debugging
  console.error('[ERROR]', appError.message, errorContext, appError);
  
  // In production, we would send this to an error monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(appError, { extra: errorContext });
    // This would be integrated with a proper error monitoring service
  }
}

/**
 * User-friendly error handling with appropriate messages
 */
export function handleError(error: any, options: {
  showToast?: boolean;
  fallbackMessage?: string;
  context?: Record<string, any>;
  onError?: (appError: AppError) => void;
} = {}): AppError {
  const {
    showToast = true,
    fallbackMessage = 'An unexpected error occurred. Please try again later.',
    context = {},
    onError
  } = options;
  
  // Create structured app error
  const appError = createAppError(error);
  appError.isHandled = true;
  
  // Log error with context
  logError(appError, context);
  
  // Show toast message if requested
  if (showToast) {
    // Format user-friendly message based on error category
    let userMessage = fallbackMessage;
    
    switch (appError.category) {
      case ErrorCategory.NETWORK:
        userMessage = 'Network connection issue. Please check your internet connection and try again.';
        break;
      case ErrorCategory.AUTHENTICATION:
        userMessage = 'Your session has expired. Please log in again.';
        break;
      case ErrorCategory.AUTHORIZATION:
        userMessage = 'You do not have permission to perform this action.';
        break;
      case ErrorCategory.VALIDATION:
        userMessage = appError.message || 'Please check your input and try again.';
        break;
      case ErrorCategory.SERVER:
        userMessage = 'The server encountered an error. Our team has been notified.';
        break;
      case ErrorCategory.TIMEOUT:
        userMessage = 'The request timed out. Please try again.';
        break;
      default:
        userMessage = appError.message || fallbackMessage;
    }
    
    toast({
      title: 'Error',
      description: userMessage,
      variant: 'destructive',
      duration: 5000
    });
  }
  
  // Call custom error handler if provided
  if (onError) {
    onError(appError);
  }
  
  return appError;
}

export default {
  createAppError,
  logError,
  handleError,
  ErrorCategory
};
