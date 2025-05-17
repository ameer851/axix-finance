/**
 * CORS Fix for CaraxFinance
 * 
 * This file contains the updated CORS configuration for development mode.
 * 
 * Instructions:
 * 1. Copy the code block between the lines into server/index.ts
 * 2. Replace the existing CORS configuration in the development section
 * 3. Restart your server
 */

// --------------- START REPLACEMENT CODE ---------------
// For development, set up a permissive CORS policy
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    // Allow requests from frontend dev server (any port)
    origin: function(origin, callback) {      const allowedOrigins = [
        'http://localhost:3000',  // Common React dev server port
        'http://localhost:4000',  // Your frontend port
        'http://localhost:5000',  // Your backend server port
        'http://localhost:5173',  // Vite default port
        'http://localhost:8000',  // Another common dev port
        undefined,                // Allow requests with no origin (like mobile apps)
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blocked request from: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
  }));
  
  // Log all CORS preflight requests for debugging
  app.options('*', (req, res) => {
    console.log('CORS preflight request received:', {
      origin: req.headers.origin,
      method: req.method
    });
    res.status(200).end();
  });
} else {
  // Production CORS settings (more restrictive)
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://your-production-domain.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}
// --------------- END REPLACEMENT CODE ---------------
