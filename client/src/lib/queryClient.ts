import { QueryClient, QueryFunction } from "@tanstack/react-query";
import config from "../config";
import { addCSRFToken, validateOrigin } from "./csrfProtection";

/**
 * Custom error handler for API responses
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    let errorDetails = {};
    
    try {
      // First try to parse as JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await res.json();
        errorMessage = json.message || json.error || res.statusText;
        errorDetails = json;
      } else {
        // Fallback to text
        errorMessage = await res.text() || res.statusText;
      }
    } catch (error) {
      // If JSON parsing fails, use statusText
      errorMessage = res.statusText || `HTTP error ${res.status}`;
    }
    
    const error = new Error(`${res.status}: ${errorMessage}`);
    // Add additional properties to the error object
    (error as any).status = res.status;
    (error as any).details = errorDetails;
    
    throw error;
  }
}

/**
 * Enhanced API request function with better error handling
 * and support for different content types
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { 
    headers?: Record<string, string>;
    throwOnError?: boolean;
    returnRawResponse?: boolean;
  }
): Promise<Response> {
  // Apply CSRF protection to all API requests
  const csrfHeaders = addCSRFToken({
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers || {})
  });

  try {
    // Check for network connectivity
    if (!navigator.onLine) {
      const error = new Error('You are currently offline. Please check your internet connection.');
      (error as any).isOffline = true;
      throw error;
    }
    
    // Add origin validation for security if this is a mutation (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      const expectedOrigins = [config.apiUrl, window.location.origin];
      if (!validateOrigin(expectedOrigins)) {
        const error = new Error('Security validation failed: Invalid request origin');
        (error as any).isSecurityError = true;
        throw error;
      }
    }

    // Prepend API URL for relative paths (those starting with /)
    const fullUrl = url.startsWith('/') ? `${config.apiUrl}${url}` : url;
    
    // Debug logging for development
    if (config.debug) {
      // API Request initiated
      // Request includes data
    }
    
    // Add mode: 'cors' explicitly for cross-origin requests
    const res = await fetch(fullUrl, {
      method,
      headers: csrfHeaders,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: 'cors',
    });
    
    // Debug logging for development
    if (config.debug) {
      // API Response received
    }

    // Only throw if needed
    if (options?.throwOnError !== false) {
      await throwIfResNotOk(res);
    }
    
    return res;
  } catch (error) {
    // Add some additional context to network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to the server. Please try again later.');
      (networkError as any).isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Handle the URL properly with the API base URL
      const url = queryKey[0] as string;
      const fullUrl = url.startsWith('/') ? `${config.apiUrl}${url}` : url;
      
      // Debug logging for development
      if (config.debug) {
        // Query Request initiated
      }
      
      const res = await fetch(fullUrl, {
        credentials: "include",
        mode: 'cors',
      });
      
      // Debug logging for development
      if (config.debug) {
        // Query Response received
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      // Check if the response is empty
      const text = await res.text();
      if (!text) {
        return null;
      }
      
      // Try to parse the JSON
      try {
        return JSON.parse(text);
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        console.error('Raw response:', text);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
