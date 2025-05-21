import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production',
  max: 10
});

async function cleanDatabase() {
  console.log('🗑️ Starting database cleanup...');
  
  try {
    // Check if tables exist first
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    if (tables.length === 0) {
      console.log('✅ No tables found in the database. Nothing to clean up.');
      return;
    }
    
    console.log(`📋 Found ${tables.length} tables in the database`);
    tables.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Drop tables and types
    console.log('🔄 Dropping all tables and types...');
    
    // First drop tables with foreign key constraints
    for (const table of tables) {
      await sql.unsafe(`DROP TABLE IF EXISTS "${table.table_name}" CASCADE`);
      console.log(`  ✓ Dropped table: ${table.table_name}`);
    }
    
    // Then drop all types/enums
    const typeResult = await sql`
      SELECT typname
      FROM pg_type 
      JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_namespace.nspname = 'public' AND pg_type.typcategory = 'E'
    `;
    
    if (typeResult.length > 0) {
      console.log(`📋 Found ${typeResult.length} enum types in the database`);
      for (const type of typeResult) {
        await sql.unsafe(`DROP TYPE IF EXISTS "${type.typname}" CASCADE`);
        console.log(`  ✓ Dropped type: ${type.typname}`);
      }
    }
    
    console.log('✅ Database cleanup completed successfully.');
    console.log('🚀 Run "npm run db:push" to recreate the schema from migrations.');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the function
cleanDatabase();
