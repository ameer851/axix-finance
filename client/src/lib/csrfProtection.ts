/**
 * CSRF Protection utility for CaraxFinance
 * Implements Cross-Site Request Forgery protection measures
 */

// Retrieve CSRF token from meta tag or cookies
export function getCSRFToken(): string {
  // First try to get from meta tag (server-rendered)
  const metaElement = document.querySelector('meta[name="csrf-token"]');
  if (metaElement && metaElement.getAttribute('content')) {
    return metaElement.getAttribute('content') as string;
  }
  
  // Fallback to cookies
  return getCookie('XSRF-TOKEN') || '';
}

// Get a cookie by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Add CSRF token to headers
export function addCSRFToken(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken();
  const newHeaders = new Headers(headers);
  
  if (token) {
    newHeaders.append('X-CSRF-Token', token);
  }
  
  return newHeaders;
}

// Validate the origin of a request against expected origins
export function validateOrigin(expectedOrigins: string[] = []): boolean {
  const origin = window.location.origin;
  const referrer = document.referrer;
  
  // Add current origin to expected origins if not already included
  if (!expectedOrigins.includes(origin)) {
    expectedOrigins.push(origin);
  }
  
  // Check if referrer belongs to expected origins
  return expectedOrigins.some(expectedOrigin => 
    referrer.startsWith(expectedOrigin)
  );
}

// Sanitize user input to prevent XSS attacks
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Export combined security utility
export default {
  getCSRFToken,
  addCSRFToken,
  validateOrigin,
  sanitizeInput
};
