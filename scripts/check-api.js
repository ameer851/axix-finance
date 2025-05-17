/**
 * API Connection Checker - Run with Node.js
 * This script tests whether the API server is running and responding correctly.
 */

const fetch = require('node-fetch');

// Configuration - set your API endpoint here
const API_URL = 'http://localhost:5000';
const TEST_ENDPOINTS = [
    '/api/health',
    '/api/profile'
];

async function checkEndpoint(url) {
    try {
        console.log(`Testing endpoint: ${url}...`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const status = response.status;
        const contentType = response.headers.get('content-type');
        
        console.log(`Status code: ${status}`);
        console.log(`Content-Type: ${contentType || 'not specified'}`);
        
        let content;
        try {
            if (contentType && contentType.includes('application/json')) {
                content = await response.json();
                console.log('Response (JSON):', JSON.stringify(content, null, 2));
            } else {
                content = await response.text();
                // Show only the first 300 characters to avoid flooding the console
                console.log(`Response (Text - first 300 chars): ${content.substring(0, 300)}...`);
                
                // Check if it's HTML
                if (content.includes('<!DOCTYPE html>') || content.includes('<html>')) {
                    console.log('WARNING: Received HTML instead of JSON. This likely means the API endpoint is not correct');
                    console.log('or the server is returning the frontend app instead of API data.');
                }
            }
        } catch (parseError) {
            console.error(`Error parsing response: ${parseError.message}`);
            content = await response.text();
            console.log(`Raw response: ${content.substring(0, 300)}...`);
        }
        
        return {
            success: response.ok,
            status,
            contentType
        };
    } catch (error) {
        console.error(`Error connecting to ${url}: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

async function main() {
    console.log('='.repeat(50));
    console.log('API CONNECTION TEST');
    console.log('='.repeat(50));
    
    // Check basic connectivity first
    try {
        console.log(`Checking if server at ${API_URL} is reachable...`);
        const response = await fetch(`${API_URL}/`);
        console.log(`Server is reachable! Status: ${response.status}`);
    } catch (error) {
        console.error(`ERROR: Cannot connect to server at ${API_URL}`);
        console.error(`Error details: ${error.message}`);
        console.error('\nPossible solutions:');
        console.error('1. Make sure your backend server is running');
        console.error('2. Check if the port is correct');
        console.error('3. Check firewall settings');
        console.error('4. If using Docker, ensure containers are running\n');
        process.exit(1);
    }
    
    console.log('\nTesting API endpoints...\n');
    
    // Check each endpoint
    for (const endpoint of TEST_ENDPOINTS) {
        console.log('-'.repeat(50));
        const result = await checkEndpoint(`${API_URL}${endpoint}`);
        
        if (!result.success) {
            console.log(`❌ ${endpoint}: FAILED`);
        } else {
            console.log(`✅ ${endpoint}: SUCCESS`);
        }
        console.log('-'.repeat(50) + '\n');
    }
    
    console.log('='.repeat(50));
    console.log('API CONNECTION TEST COMPLETE');
    console.log('='.repeat(50));
    
    console.log('\nNext steps if tests failed:');
    console.log('1. Check your server logs for errors');
    console.log('2. Verify API routes are correctly defined in your backend');
    console.log('3. Ensure CORS is configured to allow requests from your frontend');
    console.log('4. Check authentication - some endpoints may require you to be logged in');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
