// test-admin-api.js - Test if the admin API endpoints are working
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { promisify } from 'util';
import chalk from 'chalk';

// Create a cookie jar for session handling
const jar = new CookieJar();
const setCookie = promisify(jar.setCookie).bind(jar);
const getCookies = promisify(jar.getCookies).bind(jar);

// Base URL for the API
const BASE_URL = 'http://localhost:4000';
// Admin credentials
const ADMIN_EMAIL = 'admin@axixfinance.com';
const ADMIN_PASSWORD = 'admin';

// Helper function to make API requests with cookie handling
async function fetchWithCookies(url, options = {}) {
  // Get cookies for the URL
  const cookies = await getCookies(url);
  
  // Set Cookie header if there are cookies
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (cookies.length > 0) {
    headers.Cookie = cookies.map(cookie => `${cookie.key}=${cookie.value}`).join('; ');
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Extract and store cookies from the response
  const responseCookies = response.headers.raw()['set-cookie'];
  if (responseCookies) {
    for (const cookie of responseCookies) {
      await setCookie(cookie, url);
    }
  }
  
  return response;
}

// Login as admin
async function login() {
  console.log(chalk.yellow('🔑 Logging in as admin...'));
  
  const response = await fetchWithCookies(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  
  if (response.status === 200) {
    console.log(chalk.green('✅ Login successful'));
    return true;
  } else {
    const data = await response.json();
    console.log(chalk.red(`❌ Login failed: ${data.message || 'Unknown error'}`));
    return false;
  }
}

// Test endpoints
async function testEndpoints() {
  // Array of endpoints to test
  const endpoints = [
    { url: '/api/admin/users', name: 'Users List' },
    { url: '/api/admin/stats/dashboard', name: 'Dashboard Stats' },
    { url: '/api/admin/stats/users', name: 'User Stats' },
    { url: '/api/admin/stats/active-visitors', name: 'Active Visitors' },
  ];
  
  let allSuccess = true;
  
  for (const endpoint of endpoints) {
    console.log(chalk.yellow(`🔍 Testing ${endpoint.name} endpoint: ${endpoint.url}`));
    
    const response = await fetchWithCookies(`${BASE_URL}${endpoint.url}`);
    const contentType = response.headers.get('content-type');
    
    if (response.status === 200 && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(chalk.green(`✅ ${endpoint.name} endpoint is working properly`));
      console.log(chalk.grey(`   Response preview: ${JSON.stringify(data).substring(0, 100)}...`));
    } else {
      allSuccess = false;
      console.log(chalk.red(`❌ ${endpoint.name} endpoint failed`));
      console.log(chalk.red(`   Status: ${response.status}, Content-Type: ${contentType}`));
      
      // Check if it's HTML (indicating a route conflict)
      if (contentType && contentType.includes('text/html')) {
        console.log(chalk.red(`   Error: Received HTML instead of JSON. Route conflict detected.`));
      }
      
      try {
        const text = await response.text();
        console.log(chalk.grey(`   Response preview: ${text.substring(0, 100)}...`));
      } catch (error) {
        console.log(chalk.grey(`   Could not read response`));
      }
    }
  }
  
  return allSuccess;
}

// Main function
async function main() {
  console.log(chalk.blue.bold('🧪 Testing Admin Panel API Endpoints\n'));
  
  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log(chalk.red('❌ Cannot proceed with tests due to login failure'));
    process.exit(1);
  }
  
  // Test endpoints
  const endpointsWorking = await testEndpoints();
  
  if (endpointsWorking) {
    console.log(chalk.green.bold('\n✅ All admin endpoints are working properly!'));
    console.log(chalk.green('   You can now access the admin panel at http://localhost:4000/admin'));
  } else {
    console.log(chalk.red.bold('\n❌ Some admin endpoints are not working properly.'));
    console.log(chalk.yellow('   Please check the server logs for more information.'));
  }
}

// Run the main function
main().catch(error => {
  console.error(chalk.red('❌ An error occurred:'), error);
  process.exit(1);
});
