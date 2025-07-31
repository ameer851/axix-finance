import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add a delay to specific routes in development
 * This helps debug race conditions and improves the stability of auth handling
 */
export function routeDelay(req: Request, res: Response, next: NextFunction) {
  // Only delay certain routes and only in development
  if (
    process.env.NODE_ENV !== 'production' &&
    req.path.startsWith('/api/') &&
    (
      req.path.includes('/auth/') ||
      req.path.includes('/profile') ||
      req.path.includes('/transactions')
    )
  ) {
    // Add a small delay (50-150ms) to simulate network latency and improve auth handling
    const delay = Math.floor(Math.random() * 100) + 50;
    setTimeout(next, delay);
  } else {
    next();
  }
}

/**
 * Middleware to handle unauthenticated API requests more gracefully
 */
export function gracefulAuth(req: Request, res: Response, next: NextFunction) {
  // Skip for auth-related endpoints or public endpoints
  if (
    req.path.includes('/auth/') ||
    req.path.includes('/health') ||
    req.path.includes('/settings') ||
    req.method === 'OPTIONS'
  ) {
    return next();
  }
  
  // Check if the request has a session and is authenticated using passport
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
  
  // If user is not authenticated and trying to access protected resource
  if (!isAuthenticated && req.path.startsWith('/api/')) {
    // Return a more specific error for transactions endpoint
    if (req.path.includes('/transactions')) {
      return res.status(401).json({
        message: 'You must be logged in',
        code: 'AUTH_REQUIRED',
        redirectTo: '/login'
      });
    }
    
    // For profile requests
    if (req.path.includes('/profile')) {
      return res.status(401).json({
        message: 'Authentication required to access profile',
        code: 'AUTH_REQUIRED',
        redirectTo: '/login'
      });
    }
  }
  
  next();
}
