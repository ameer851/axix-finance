// Application configuration
const config = {
  // API base URL - explicitly set based on environment
  apiUrl: 'http://localhost:3000',
  
  // Set with protocol to avoid CORS issues
  frontendUrl: 'http://localhost:4000',
  
  // Health check endpoint
  healthCheckEndpoint: '/api/health',
  
  // Other configuration settings
  appName: 'CaraxFinance',
  version: '1.0.0',
  
  // For development debugging
  debug: true
};

console.log('CaraxFinance config loaded:', config);

export default config;
