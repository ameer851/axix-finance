/**
 * API client with consistent error handling for JSON responses
 */

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Safely parses JSON with error handling
 */
function safeJsonParse(text: string) {
  try {
    return { data: JSON.parse(text), error: null };
  } catch (error) {
    console.error('Error parsing JSON:', error);
    console.debug('Raw response text:', text);
    return { data: null, error: new Error('Invalid JSON response from server') };
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
  
  // Add default headers
  const headers = {
    'Accept': 'application/json',
    ...(fetchOptions.headers || {})
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= retries) {
    try {
      if (attempt > 0) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        console.log(`Retrying request to ${url} (attempt ${attempt} of ${retries})`);
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
      const contentType = response.headers.get('content-type');
      const text = await response.text();

      // Empty response handling
      if (!text || text.trim() === '') {
        throw new Error('Empty response received from server');
      }

      // Parse JSON safely
      const { data, error } = safeJsonParse(text);
      
      if (error) {
        // Handle HTML responses (likely server error pages)
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server returned an HTML page instead of JSON. The server might be experiencing issues.');
        }
        throw error;
      }

      // Handle API errors indicated by status codes
      if (!response.ok) {
        const message = data?.message || response.statusText || 'Unknown error';
        const apiError = new Error(`API Error (${response.status}): ${message}`);
        (apiError as any).status = response.status;
        (apiError as any).data = data;
        throw apiError;
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (
        error instanceof TypeError && 
        error.message.includes('NetworkError') ||
        (error as any).name === 'AbortError'
      ) {
        clearTimeout(timeoutId);
        throw new Error('Network error: Please check your connection');
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
  throw lastError || new Error('Unknown error occurred');
}

// Shorthand methods for common HTTP methods
export const api = {
  get: <T = any>(url: string, options: FetchOptions = {}) => 
    apiFetch<T>(url, { ...options, method: 'GET' }),
    
  post: <T = any>(url: string, data: any, options: FetchOptions = {}) =>
    apiFetch<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify(data)
    }),
    
  put: <T = any>(url: string, data: any, options: FetchOptions = {}) =>
    apiFetch<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify(data)
    }),
    
  delete: <T = any>(url: string, options: FetchOptions = {}) =>
    apiFetch<T>(url, { ...options, method: 'DELETE' })
};
