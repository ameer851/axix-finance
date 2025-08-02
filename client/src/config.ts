// Application configuration
const config = {
  // API base URL - Use the correct production API URL
  apiUrl: import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? 'http://localhost:4000' : 'https://axix-finance.vercel.app'),
  
  // Frontend URL - environment dependent
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 
    (import.meta.env.DEV 
      ? 'http://localhost:4000' 
      : 'https://axix-finance.vercel.app'),
  
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://wvnyiinrmfysabsfztii.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
  },
  
  // Health check endpoint
  healthCheckEndpoint: '/api/health',
  
  // Other configuration settings
  appName: 'Axix Finance',
  version: '1.0.0',
  
  // For development debugging
  debug: import.meta.env.DEV
};

// Config loaded

export default config;
