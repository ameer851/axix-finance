import { QueryClient, QueryFunction } from "@tanstack/react-query";
import config from "../config";
import { addCSRFToken, validateOrigin } from "./csrfProtection";
import { supabase } from "./supabase";

/**
 * Get the current Supabase session token for authentication
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Custom error handler for API responses
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    let errorDetails = {};

    try {
      // Special handling for 401 Unauthorized responses
      if (res.status === 401) {
        console.warn("Authentication required - redirecting to login");

        // Clear auth data
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");

        // Redirect to login after a brief delay to allow this error to be handled
        setTimeout(() => {
          window.location.href = "/login?reason=session-expired";
        }, 100);

        errorMessage = "Authentication required - please log in again";
        throw new Error(errorMessage);
      }

      // Clone the response before trying to read its body
      // This prevents "body already read" errors
      const responseClone = res.clone();

      // Check the content type
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const errorData = await responseClone.json();
          errorMessage = errorData.message || errorData.error || res.statusText;
          errorDetails = errorData;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = res.statusText || "Unknown error";
        }
      } else {
        // Try to get text response
        try {
          const errorText = await responseClone.text();
          errorMessage = errorText || res.statusText || "Unknown error";
        } catch (textError) {
          console.error("Error reading error response:", textError);
          errorMessage = res.statusText || "Unknown error";
        }
      }
    } catch (error) {
      console.error("Error handling response:", error);
      errorMessage = res.statusText || "Unknown error";
    }

    const apiError = new Error(errorMessage);
    (apiError as any).status = res.status;
    (apiError as any).details = errorDetails;
    throw apiError;
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
  // Get authentication token
  const authToken = await getAuthToken();

  // Apply CSRF protection to all API requests
  const csrfHeaders = addCSRFToken({
    ...(data ? { "Content-Type": "application/json" } : {}),
    Accept: "application/json",
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...(options?.headers || {}),
  });

  try {
    // Check for network connectivity
    if (!navigator.onLine) {
      const error = new Error(
        "You are currently offline. Please check your internet connection."
      );
      (error as any).isOffline = true;
      throw error;
    }

    // Add origin validation for security if this is a mutation (POST, PUT, DELETE)
    // Disabled in development to avoid CORS issues
    if (
      false &&
      ["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase())
    ) {
      const expectedOrigins = [config.apiUrl, window.location.origin];
      if (!validateOrigin(expectedOrigins)) {
        const error = new Error(
          "Security validation failed: Invalid request origin"
        );
        (error as any).isSecurityError = true;
        throw error;
      }
    }

    // Prepend API URL for relative paths (those starting with /)
    const fullUrl = url.startsWith("/") ? `${config.apiUrl}${url}` : url;

    // Debug logging for development
    if (config.debug) {
      console.log(`API Request: ${method} ${fullUrl}`, data ? { data } : "");
    }

    // Set a reasonable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Add mode: 'cors' explicitly for cross-origin requests
      const res = await fetch(fullUrl, {
        method,
        headers: csrfHeaders,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        mode: "cors",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Debug logging for development
      if (config.debug) {
        console.log(
          `API Response: ${res.status} ${res.statusText} - ${method} ${fullUrl}`
        );
      }

      // Only throw if needed
      if (options?.throwOnError !== false) {
        await throwIfResNotOk(res);
      }

      return res;
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      // Handle timeout errors
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        const timeoutError = new Error(
          "Request timed out. The server may be experiencing high load."
        );
        (timeoutError as any).isTimeout = true;
        throw timeoutError;
      }

      throw fetchError;
    }
  } catch (error) {
    // Add some additional context to network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      const networkError = new Error(
        "Unable to connect to the server. Please try again later."
      );
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
      const fullUrl = url.startsWith("/") ? `${config.apiUrl}${url}` : url;

      // Get authentication token
      const authToken = await getAuthToken();

      // Debug logging for development
      if (config.debug) {
        // Query Request initiated
      }

      const res = await fetch(fullUrl, {
        credentials: "include",
        mode: "cors",
        headers: {
          Accept: "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
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

      // Handle empty responses
      if (!text || text.trim() === "") {
        console.warn("Empty response received from server");
        return null;
      }

      // Check if response is HTML instead of JSON (server error page)
      if (
        text.trim().startsWith("<!DOCTYPE html>") ||
        text.trim().startsWith("<html")
      ) {
        console.error(
          "Server returned HTML instead of JSON. Possible server error."
        );
        throw new Error(
          "Server returned invalid response format. Please try again later."
        );
      }

      // Try to parse the JSON
      try {
        return JSON.parse(text);
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        // Only log first 500 chars to avoid console clutter
        console.debug(
          "Raw response (truncated):",
          text.substring(0, 500) + (text.length > 500 ? "..." : "")
        );
        throw new Error(
          "Invalid JSON response from server. Please try again later."
        );
      }
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds default stale time
      retry: (failureCount, error: any) => {
        // Don't retry on rate limit errors or authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        if (
          error?.message?.includes("Rate limit exceeded") ||
          error?.message?.includes("429")
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on rate limit or auth errors
        if (
          error?.status === 401 ||
          error?.status === 403 ||
          error?.status === 429
        ) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});
