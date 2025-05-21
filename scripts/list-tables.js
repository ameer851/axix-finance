import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production',
  max: 10
});

async function listTables() {  try {
    console.log('Connected to database, listing tables...');
    
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    if (result.length === 0) {
      console.log('No tables found in the database.');
      return;
    }
    
    console.log('Tables in the database:');
    result.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    await sql.end();
  }
}

listTables();
