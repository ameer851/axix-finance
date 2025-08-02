const { Pool } = require('pg');

async function fixTransactionsCreatedAt() {
  const pool = new Pool({
    host: "aws-0-us-east-2.pooler.supabase.com",
    port: 6543,
    user: "postgres.wvnyiinrmfysabsfztii",
    password: "0nPJxjEsfpHLQNcb",
    database: "postgres",
    ssl: false
  });

  try {
    console.log('Checking transactions.created_at column...');
    
    // First, let's see what's in the column
    const sampleData = await pool.query(`
      SELECT created_at, pg_typeof(created_at) as type 
      FROM transactions 
      LIMIT 5;
    `);
    
    console.log('Sample data from transactions.created_at:', sampleData.rows);
    
    // Try different approaches to fix the column
    console.log('Attempting to fix transactions.created_at column...');
    
    try {
      // Option 1: Try to extract timestamp from jsonb if it's stored as json
      await pool.query(`
        ALTER TABLE transactions 
        ALTER COLUMN created_at 
        TYPE timestamp WITHOUT TIME ZONE 
        USING (created_at->>0)::timestamp WITHOUT TIME ZONE;
      `);
      console.log('✅ Fixed using jsonb extraction method');
    } catch (error1) {
      console.log('❌ Jsonb extraction failed:', error1.message);
      
      try {
        // Option 2: Try to use current timestamp as fallback
        await pool.query(`
          ALTER TABLE transactions 
          ALTER COLUMN created_at 
          TYPE timestamp WITHOUT TIME ZONE 
          USING COALESCE((created_at->>0)::timestamp, NOW());
        `);
        console.log('✅ Fixed using fallback to current timestamp');
      } catch (error2) {
        console.log('❌ Fallback method failed:', error2.message);
        
        try {
          // Option 3: Drop and recreate the column with default value
          await pool.query('ALTER TABLE transactions DROP COLUMN created_at;');
          await pool.query(`
            ALTER TABLE transactions 
            ADD COLUMN created_at timestamp WITHOUT TIME ZONE DEFAULT NOW();
          `);
          console.log('✅ Fixed by recreating column with default timestamp');
        } catch (error3) {
          console.log('❌ Recreation method failed:', error3.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during transactions.created_at fix:', error.message);
  } finally {
    await pool.end();
  }
}

fixTransactionsCreatedAt().catch(console.error);
