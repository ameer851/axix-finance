import 'dotenv/config';
import { Pool } from 'pg';

async function checkDatabases() {
  // First, connect to the default postgres database to check what exists
  const defaultUrl = process.env.DATABASE_URL.replace(/\/[^\/]+$/, '/postgres');
  console.log('Connecting to:', defaultUrl);
  
  const pool = new Pool({ connectionString: defaultUrl });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL server successfully!');
    
    // List all databases
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
    );
    
    console.log('\n📋 Available databases:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.datname}`);
    });
    
    client.release();
    
    // Now try to connect to our target database
    console.log('\n🔍 Testing connection to target database...');
    const targetPool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const targetClient = await targetPool.connect();
      console.log('✅ Successfully connected to target database!');
      
      // Test a simple query
      const testResult = await targetClient.query('SELECT NOW() as current_time');
      console.log('⏰ Database time:', testResult.rows[0].current_time);
      
      targetClient.release();
      await targetPool.end();
    } catch (targetError) {
      console.log('❌ Failed to connect to target database:', targetError.message);
      
      if (targetError.code === '3D000') {
        console.log('💡 Database does not exist. You may need to create it.');
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL server:', error.message);
    console.error('Code:', error.code);
  } finally {
    await pool.end();
  }
}

checkDatabases();
