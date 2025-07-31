// Test script to submit a deposit and check if email is sent

// Test balance API endpoint
async function testBalanceAPI() {
  console.log('🧪 Testing balance API endpoint...');
  
  try {
    const response = await fetch('http://localhost:4000/api/users/16/balance', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    console.log('💰 Balance response:', result);
    
    if (response.ok) {
      console.log('✅ Balance API working correctly');
    } else {
      console.log('❌ Balance API failed:', result.message);
    }
  } catch (error) {
    console.error('💥 Balance test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testBalanceAPI();
}

runTests();
