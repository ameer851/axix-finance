// Global error handler for fetch errors, API errors, and third-party service errors
const originalConsoleError = console.error;

/**
 * Initialize global error handling for the client
 * This helps suppress unnecessary errors in the console that we can't fix
 * (like third-party CORS errors) while still logging important errors
 */
export function initGlobalErrorHandling() {
  // Override console.error to filter out certain errors
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suppress specific third-party errors
    if (
      // Google Translate errors
      message.includes('translate.googleapis.com') ||
      message.includes('googleusercontent.com') ||
      message.includes('gstatic.com') ||
      message.includes('too much recursion') ||
      message.includes('CORS request did not succeed') ||
      message.includes('Cross-Origin Request Blocked') ||
      
      // Cookie errors we can't fix
      message.includes('__cflb') ||
      message.includes('SameSite') ||
      message.includes('cross-site context') ||
      
      // Common third-party analytics errors
      message.includes('script.crazyegg.com') ||
      message.includes('servedbyadbutler.com') ||
      message.includes('tradingview.com') ||
      message.includes('coinmarketcap.com') ||
      message.includes('coin360.com') ||
      
      // JSON parsing errors
      message.includes('SyntaxError: JSON.parse') ||
      
      // React/DOM errors from third-party components
      message.includes('Warning: Invalid DOM property') ||
      message.includes('Warning: React does not recognize') ||
      
      // Common initial auth errors during page load
      (message.includes('API Error (401)') && message.includes('You must be logged in')) ||
      
      // Vite WebSocket connection errors
      message.includes('failed to connect to websocket') ||
      message.includes('WebSocket connection') ||
      message.includes('vite:ws') ||
      
      // Content Security Policy violations we can't control
      message.includes('Content-Security-Policy') ||
      message.includes('Refused to connect') ||
      
      // Network errors for external services
      message.includes('NetworkError') ||
      message.includes('Failed to fetch')
    ) {
      // Log to debug instead if we need to track these
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[Suppressed Error]', ...args);
      }
      return; // Skip logging
    }
    
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
  
  // Handle global unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Suppress specific errors
    if (
      error && 
      (
        // Suppress third-party script errors
        (error.message && (
          error.message.includes('translate.googleapis.com') ||
          error.message.includes('coin360.com') ||
          error.message.includes('SyntaxError: JSON.parse')
        )) ||
        // Suppress network errors for external domains
        (error.stack && error.stack.includes('googleusercontent.com')) ||
        
        // Suppress WebSocket connection errors
        (error.message && (
          error.message.includes('WebSocket') ||
          error.message.includes('websocket') ||
          error.message.includes('vite:ws')
        ))
      )
    ) {
      // Prevent the error from showing in the console
      event.preventDefault();
      
      // Log to debug instead
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[Suppressed Unhandled Rejection]', error);
      }
    }
  });
  
  // Add a global error handler
  window.addEventListener('error', (event) => {
    // Suppress specific errors
    if (
      event.filename && (
        event.filename.includes('translate.google') ||
        event.filename.includes('googleapis.com') ||
        event.filename.includes('googleusercontent.com') ||
        event.filename.includes('coin360.com') ||
        event.filename.includes('vite') ||
        event.filename.includes('websocket')
      )
    ) {
      // Prevent the error from showing in the console
      event.preventDefault();
      
      // Log to debug instead
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[Suppressed Error Event]', event.error);
      }
      
      return false; // Prevent default handling
    }
    
    return true; // Allow default handling for other errors
  }, true);
}
