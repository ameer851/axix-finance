/**
 * Helper functions for API requests
 */

/**
 * Helper function to safely process API responses
 * @param response The fetch Response object
 * @param errorContext Context description for error logging
 * @returns Parsed JSON response
 * @throws Error if response is not JSON or there's an authentication issue
 */
export const safelyParseJSON = async (response: Response, errorContext: string) => {
  // Check if response is JSON before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.error(`${errorContext} - Non-JSON response:`, response.status, contentType);
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required - please log in as admin');
    }
    
    // Try to get error text
    const errorText = await response.text();
    console.error(`Response body:`, errorText.substring(0, 500)); // Log first 500 chars
    
    throw new Error(`Invalid response format from server: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
};
