# CORS Configuration for Backend Server

For your backend server running on port 5000 to accept requests from your frontend running on port 4000, you need to update your CORS configuration.

## Quick Fix for CORS Issues

Add this CORS configuration to your backend server (server/index.ts):

```typescript
import cors from "cors";

// CORS configuration for development
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: 'http://localhost:4000',  // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
  }));
  
  // Log CORS preflight requests for debugging
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
```

## Testing the Connection

After applying this fix, you can test if the backend is accepting requests from your frontend:

1. Start both your frontend and backend servers
2. Open your browser console
3. Run this test in the console:

```javascript
fetch('http://localhost:5000/api/health', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Accept': 'application/json'
  }
}).then(res => res.json()).then(data => console.log(data)).catch(err => console.error(err));
```

If this works without CORS errors, your configuration is correct.

## Common CORS-related Errors

1. **"No 'Access-Control-Allow-Origin' header is present"** - The backend server is not configured to accept requests from your frontend origin.

2. **"Request has been blocked by CORS policy: Response to preflight request doesn't pass"** - Your backend is not responding correctly to OPTIONS requests.

3. **"Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource"** - The browser is blocking the request due to CORS policy violations.

Remember to restart your backend server after making changes to the CORS configuration.
