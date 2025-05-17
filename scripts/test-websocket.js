// Test script for WebSocket connection
// This script tests both the API connection and WebSocket connection
const WebSocket = require('ws');
const http = require('http');

// Configuration
const API_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws/notifications';
const TEST_USER_ID = 1; // Replace with a valid user ID from your system

// Step 1: Test API health endpoint
console.log('1. Testing API connection...');
http.get(`${API_URL}/api/health`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`   API Health Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`   Response: ${data}`);
    console.log('   API connection test completed');
    console.log('');
    
    // Step 2: Test WebSocket connection
    testWebSocket();
  });
}).on('error', (err) => {
  console.error(`   ❌ API connection failed: ${err.message}`);
  console.log('   Make sure the server is running on port 5000');
  console.log('');
  
  // Try WebSocket anyway
  testWebSocket();
});

// Function to test WebSocket connection
function testWebSocket() {
  console.log('2. Testing WebSocket connection...');
  
  try {
    const ws = new WebSocket(`${WS_URL}?userId=${TEST_USER_ID}`);
    
    ws.on('open', () => {
      console.log('   ✅ WebSocket connection established!');
      
      // Send a test message
      const message = {
        type: 'ping',
        data: { message: 'Testing connection' }
      };
      
      ws.send(JSON.stringify(message));
      console.log('   Sent test message to server');
      
      // Close after 3 seconds
      setTimeout(() => {
        console.log('   Closing WebSocket connection...');
        ws.close();
        console.log('   Test completed');
      }, 3000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('   Received message from server:');
        console.log(`   Type: ${message.type}`);
        console.log(`   Data: ${JSON.stringify(message.data)}`);
      } catch (e) {
        console.log('   Received non-JSON message:', data);
      }
    });
    
    ws.on('error', (err) => {
      console.error(`   ❌ WebSocket error: ${err.message}`);
      console.log('   Make sure the server is running and WebSocket implementation is correct');
    });
    
    ws.on('close', () => {
      console.log('   WebSocket connection closed');
    });
  } catch (err) {
    console.error(`   ❌ Failed to create WebSocket connection: ${err.message}`);
    console.log('   Make sure the WebSocket URL is correct and the server is running');
  }
}
