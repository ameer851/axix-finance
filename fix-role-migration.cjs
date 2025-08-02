const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixRoleColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations', 'fix-role-column.sql'), 'utf8');
  
  try {
    console.log('Applying role column fix...');
    await pool.query(migrationSql);
    console.log('✅ Role column fix applied successfully');
  } catch (error) {
    console.error('❌ Error applying role column fix:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixRoleColumn().catch(console.error);
