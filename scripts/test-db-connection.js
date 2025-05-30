import 'dotenv/config';
import { Pool } from 'pg';

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🔢 PostgreSQL version:', result.rows[0].version);
    
    // Check if CaraxFinance database exists
    const dbCheck = await client.query(`
      SELECT datname FROM pg_database WHERE datname = 'CaraxFinance'
    `);
    
    if (dbCheck.rows.length > 0) {
      console.log('✅ CaraxFinance database exists');
    } else {
      console.log('❌ CaraxFinance database does not exist');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Troubleshooting tips:');
      console.log('1. Make sure PostgreSQL is running on port 5000');
      console.log('2. Check if the database "CaraxFinance" exists');
      console.log('3. Verify username and password are correct');
    }
  } finally {
    await pool.end();
  }
}

testConnection();
