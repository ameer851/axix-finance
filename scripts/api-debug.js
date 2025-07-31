// api-debug.js - Script to diagnose API response issues
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Setup path and environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Base URL for the API
const BASE_URL = process.env.API_URL || 'http://localhost:4000';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Axix-Admin@123';

async function debugApiEndpoint(endpoint, token = null) {
  console.log(`\n🔍 Testing endpoint: ${endpoint}`);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['Cookie'] = `connect.sid=${token}`;
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    // Log headers
    console.log('Response headers:');
    response.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });
    
    // Get the raw text response first
    const rawText = await response.text();
    console.log('Raw response text:');
    console.log(rawText.substring(0, 1000) + (rawText.length > 1000 ? '... [truncated]' : ''));
    
    // Try to parse as JSON to see if it's valid
    try {
      const jsonData = JSON.parse(rawText);
      console.log('Parsed JSON response:');
      console.log(JSON.stringify(jsonData, null, 2).substring(0, 1000) + 
                (JSON.stringify(jsonData, null, 2).length > 1000 ? '... [truncated]' : ''));
    } catch (jsonError) {
      console.error('❌ Error parsing response as JSON:', jsonError.message);
      console.log('The first 10 characters of the response:', rawText.substring(0, 10).split('').map(c => c.charCodeAt(0)));
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function loginAndGetToken() {
  try {
    console.log(`\n🔐 Attempting to log in as ${ADMIN_USERNAME}`);
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      })
    });
    
    console.log(`Login status: ${response.status} ${response.statusText}`);
    
    // Get the raw text response
    const rawText = await response.text();
    
    try {
      const jsonResponse = JSON.parse(rawText);
      console.log('Login successful:', jsonResponse.id ? 'User ID: ' + jsonResponse.id : 'Unknown response format');
      
      // Extract session cookie
      const cookies = response.headers.get('set-cookie');
      console.log('Cookies:', cookies);
      
      if (cookies) {
        const sessionMatch = cookies.match(/connect\.sid=([^;]+)/);
        if (sessionMatch) {
          return sessionMatch[1];
        }
      }
      
      // If no cookie but successful response, return user ID
      return jsonResponse.id;
      
    } catch (jsonError) {
      console.error('❌ Error parsing login response as JSON:', jsonError.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Login network error:', error.message);
    return null;
  }
}

async function diagnoseApiIssues() {
  console.log('🚀 Starting API diagnostics...');
  
  console.log(`\nBase URL: ${BASE_URL}`);
  
  // First test health endpoint which should always work
  await debugApiEndpoint('/api/health');
  
  // Login to get authentication token
  const token = await loginAndGetToken();
  
  if (!token) {
    console.log('❌ Could not obtain authentication token, stopping tests');
    return;
  }
  
  console.log(`\n✅ Got authentication token/ID: ${token}`);
  
  // Test user endpoint to verify authentication
  await debugApiEndpoint('/api/user', token);
  
  // Test endpoints that might be causing the users fetch error
  await debugApiEndpoint('/api/admin/users', token);
  await debugApiEndpoint('/api/admin/users/stats', token);
  await debugApiEndpoint('/api/admin/dashboard-stats', token);
  await debugApiEndpoint('/api/admin/active-visitors', token);
  
  console.log('\n✅ API diagnostics completed');
}

diagnoseApiIssues();
