const { Pool } = require('pg');

async function testWithUrlEncoding() {
  // Try different connection approaches
  const host = 'aws-0-us-east-2.pooler.supabase.com';
  const port = 6543;
  const database = 'postgres';
  const username = 'postgres.wvnyiinrmfysabsfztii';
  const password = '0nPJxjEsfpHLQNcb'; // The password from your .env
  
  // Method 1: Try with URL encoding
  const encodedPassword = encodeURIComponent(password);
  const connectionString1 = `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}`;
  
  // Method 2: Try with connection object
  const connectionConfig = {
    host: host,
    port: port,
    database: database,
    user: username,
    password: password,
    ssl: {
      rejectUnauthorized: false
    }
  };
  
  console.log('Testing Method 1: URL with encoded password');
  await testConnection(connectionString1);
  
  console.log('\nTesting Method 2: Connection object');
  await testConnectionObject(connectionConfig);
}

async function testConnection(connectionString) {
  const pool = new Pool({ connectionString });
  try {
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    client.release();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

async function testConnectionObject(config) {
  const pool = new Pool(config);
  try {
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    client.release();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testWithUrlEncoding();
