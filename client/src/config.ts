// Application configuration
const config = {
  // API base URL - in development, API is served on the same port via Vite proxy
  apiUrl: '',  // Empty string means same origin
  
  // Set with protocol to avoid CORS issues
  frontendUrl: 'http://localhost:4000',
  
  // Health check endpoint
  healthCheckEndpoint: '/api/health',
  
  // Other configuration settings
  appName: 'Axix Finance',
  version: '1.0.0',
  
  // For development debugging
  debug: true
};

// Config loaded

export default config;
