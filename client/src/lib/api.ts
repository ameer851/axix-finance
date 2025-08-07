/**
 * API client with consistent error handling for JSON responses
 */

import { supabase } from "./supabase";

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Safely parses JSON with enhanced error handling
 */
function safeJsonParse(text: string) {
  // Check for empty responses
  if (!text || text.trim() === "") {
    return {
      data: null,
      error: new Error("Empty response received from server"),
    };
  }

  // Check if response is HTML (common server error pages)
  if (
    text.trim().startsWith("<!DOCTYPE html>") ||
    text.trim().startsWith("<html") ||
    text.includes("<body") ||
    text.includes("<head")
  ) {
    console.warn("HTML response received when expecting JSON");

    // Try to extract a useful message from the HTML (e.g., from the title)
    let htmlMessage = "Server returned HTML instead of JSON";
    try {
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        htmlMessage += `: ${titleMatch[1]}`;
      }
    } catch (e) {
      // Ignore extraction errors
    }

    return { data: null, error: new Error(htmlMessage) };
  }

  // Try to parse as JSON
  try {
    return { data: JSON.parse(text), error: null };
  } catch (error) {
    console.error("Error parsing JSON:", error);
    console.debug(
      "Raw response text (first 500 chars):",
      text.substring(0, 500)
    );

    // Include a part of the response in the error for debugging
    const snippet = text.length > 50 ? text.substring(0, 50) + "..." : text;
    return {
      data: null,
      error: new Error(`Invalid JSON response from server: ${snippet}`),
    };
  }
}

/**
 * Get the current Supabase session token for authentication
 */
async function getAuthToken(): Promise<string | null> {
  console.log("Attempting to get auth token from Supabase...");
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session from Supabase:", error);
      return null;
    }

    if (!session) {
      console.warn("No active session found after login attempt.");
      return null;
    }

    console.log("✅ Supabase session retrieved successfully!");
    console.log(
      "Session expires at:",
      new Date(session.expires_at * 1000).toLocaleString()
    );
    console.log("Token length:", session.access_token?.length || 0);

    return session.access_token;
  } catch (error) {
    console.error(
      "🚨 CRITICAL ERROR in getAuthToken - This is likely a network issue:",
      error
    );
    console.error("Error type:", typeof error);
    console.error(
      "Error name:",
      error instanceof Error ? error.name : "Unknown"
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "No message"
    );
    return null;
  }
}

/**
 * Enhanced fetch with timeout, retry, and error handling
 */
export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Get authentication token
  const authToken = await getAuthToken();

  // Add default headers with authentication
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...(fetchOptions.headers || {}),
  };

  // Add Content-Type for methods that have a body
  if (
    fetchOptions.body &&
    !headers["Content-Type"] &&
    typeof fetchOptions.body === "string"
  ) {
    try {
      JSON.parse(fetchOptions.body); // Check if it's a JSON string
      headers["Content-Type"] = "application/json";
    } catch (e) {
      // Not a JSON string, do not set header
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= retries) {
    try {
      if (attempt > 0) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        console.log(
          `Retrying request to ${url} (attempt ${attempt} of ${retries})`
        );
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      // Always clear timeout
      clearTimeout(timeoutId);

      // For empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      // Check if response is HTML instead of JSON (server error)
      const contentType = response.headers.get("content-type");
      const text = await response.text();

      // Empty response handling
      if (!text || text.trim() === "") {
        throw new Error("Empty response received from server");
      }

      // If the response is HTML (often from error pages) instead of JSON
      if (
        contentType?.includes("text/html") ||
        text.trim().startsWith("<!DOCTYPE html>")
      ) {
        console.error("HTML response received when expecting JSON");
        // Return empty data to prevent JSON parse errors
        if (response.ok) {
          return {} as T;
        } else {
          throw new Error(
            "Server returned HTML instead of JSON. Please try again later."
          );
        }
      }

      // Parse JSON safely
      const { data, error } = safeJsonParse(text);

      if (error) {
        // Handle HTML responses (likely server error pages)
        if (contentType && contentType.includes("text/html")) {
          throw new Error(
            "Server returned an HTML page instead of JSON. The server might be experiencing issues."
          );
        }
        throw error;
      }

      // Handle API errors indicated by status codes
      if (!response.ok) {
        const message = data?.message || response.statusText || "Unknown error";
        const apiError = new Error(
          `API Error (${response.status}): ${message}`
        );
        (apiError as any).status = response.status;
        (apiError as any).data = data;
        throw apiError;
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (
        (error instanceof TypeError &&
          error.message.includes("NetworkError")) ||
        (error as any).name === "AbortError"
      ) {
        clearTimeout(timeoutId);
        throw new Error("Network error: Please check your connection");
      }

      // Last attempt failed, throw the error
      if (attempt === retries) {
        clearTimeout(timeoutId);
        throw lastError;
      }

      attempt++;
    }
  }

  // This shouldn't happen, but TypeScript wants a return statement
  throw lastError || new Error("Unknown error occurred");
}

// Shorthand methods for common HTTP methods
export const api = {
  get: <T = any>(url: string, options: FetchOptions = {}) =>
    apiFetch<T>(url, { ...options, method: "GET" }),

  post: <T = any>(url: string, data: any, options: FetchOptions = {}) =>
    apiFetch<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: JSON.stringify(data),
    }),

  put: <T = any>(url: string, data: any, options: FetchOptions = {}) =>
    apiFetch<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: JSON.stringify(data),
    }),

  delete: <T = any>(url: string, options: FetchOptions = {}) =>
    apiFetch<T>(url, { ...options, method: "DELETE" }),
};
