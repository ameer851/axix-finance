// filepath: c:\Users\BABA\Documents\CaraxFinance\scripts\push-db.js
import 'dotenv/config';
import { execSync } from 'child_process';

console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

try {
  console.log('Running database migration...');
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('Database migration completed successfully');
} catch (error) {
  console.error('Database migration failed:', error.message);
  process.exit(1);
}