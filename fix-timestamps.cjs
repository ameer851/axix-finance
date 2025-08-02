const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixTimestampColumns() {
  const pool = new Pool({
    host: "aws-0-us-east-2.pooler.supabase.com",
    port: 6543,
    user: "postgres.wvnyiinrmfysabsfztii",
    password: "0nPJxjEsfpHLQNcb",
    database: "postgres",
    ssl: false
  });

  const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations', 'fix-timestamp-columns.sql'), 'utf8');
  
  try {
    console.log('Applying timestamp column fixes...');
    await pool.query(migrationSql);
    console.log('✅ Timestamp column fixes applied successfully');
  } catch (error) {
    console.error('❌ Error applying timestamp fixes:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixTimestampColumns().catch(console.error);
