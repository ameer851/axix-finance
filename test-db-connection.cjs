const { Pool } = require('pg');

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testing connection with URL:', connectionString ? 'URL found' : 'URL missing');
  
  const pool = new Pool({
    connectionString: connectionString
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query test successful:', result.rows[0]);
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
