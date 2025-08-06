
// Console filter specifically for development environment issues
export function setupDevelopmentConsoleFilters() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Store original console methods
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalInfo = console.info;

  // Filter console.warn
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Suppress Vite/WebSocket warnings in development
    if (
      message.includes('[vite]') ||
      message.includes('WebSocket') ||
      message.includes('websocket') ||
      message.includes('HMR') ||
      message.includes('hot reload') ||
      message.includes('connect ECONNREFUSED')
    ) {
      return; // Suppress these warnings
    }
    
    originalWarn.apply(console, args);
  };

  // Filter console.log for development noise
  console.log = (...args) => {
    const message = args.join(' ');
    
    // Suppress specific development logs
    if (
      message.includes('vite:hmr') ||
      message.includes('[vite] page reload') ||
      message.includes('WebSocket closed')
    ) {
      return; // Suppress these logs
    }
    
    originalLog.apply(console, args);
  };

  // Add event listener for unhandled WebSocket errors
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (error && error.message && (
      error.message.includes('WebSocket') ||
      error.message.includes('vite') ||
      error.message.includes('connect ECONNREFUSED')
    )) {
      event.preventDefault(); // Prevent these from showing
      return;
    }
  });
}
