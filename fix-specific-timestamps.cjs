const { Pool } = require('pg');

async function fixSpecificTimestamp() {
  const pool = new Pool({
    host: "aws-0-us-east-2.pooler.supabase.com",
    port: 6543,
    user: "postgres.wvnyiinrmfysabsfztii",
    password: "0nPJxjEsfpHLQNcb",
    database: "postgres",
    ssl: false
  });

  try {
    console.log('Checking for problematic timestamp columns...');
    
    // Get all tables and their created_at/updated_at column types
    const result = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE column_name IN ('created_at', 'updated_at') 
        AND table_schema = 'public'
      ORDER BY table_name, column_name;
    `);
    
    console.log('Found timestamp columns:', result.rows);
    
    // Try to fix each problematic column
    for (const row of result.rows) {
      if (row.data_type !== 'timestamp without time zone') {
        console.log(`Fixing ${row.table_name}.${row.column_name} (currently ${row.data_type})`);
        
        try {
          await pool.query(`
            ALTER TABLE "${row.table_name}" 
            ALTER COLUMN "${row.column_name}" 
            TYPE timestamp WITHOUT TIME ZONE 
            USING "${row.column_name}"::timestamp WITHOUT TIME ZONE;
          `);
          
          console.log(`✅ Fixed ${row.table_name}.${row.column_name}`);
        } catch (error) {
          console.log(`❌ Could not fix ${row.table_name}.${row.column_name}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Timestamp column fixes completed');
  } catch (error) {
    console.error('❌ Error during timestamp fix:', error.message);
  } finally {
    await pool.end();
  }
}

fixSpecificTimestamp().catch(console.error);
