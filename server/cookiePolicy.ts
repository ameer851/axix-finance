import { Request, Response, NextFunction } from 'express';

// Extend express Response to include proper cookie typing
declare module 'express' {
  interface Response {
    cookie(name: string, val: string, options?: any): Response;
  }
}

export function setupCookiePolicy(req: Request, res: Response, next: NextFunction) {
  // Store the original cookie function
  const originalSetCookie = res.cookie;
  
  // Override the cookie function
  res.cookie = function(name: string, val: string, options: any = {}) {
    const origin = req.headers.origin;
    const isCrossOrigin = origin && !origin.includes(req.headers.host as string);
    
    // Ensure SameSite=None cookies always have the secure flag
    if (options.sameSite === 'none' || options.sameSite === 'None') {
      options.secure = true;
    }
    
    // If it's a cross-origin request, adjust the cookie settings
    if (isCrossOrigin || process.env.NODE_ENV === 'production') {
      options.secure = true;
      options.sameSite = 'None'; // Capitalization matters in some browsers
    }
    
    // Call the original cookie function with our adjusted options
    return originalSetCookie.call(this, name, val, options);
  };
  
  next();
}
