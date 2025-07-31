import postgres from 'postgres';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function applyMigration() {
  const migrationSql = readFileSync(resolve(__dirname, '../migrations/0009_add_plan_tracking_fields.sql'), 'utf8');
  
  try {
    await sql.unsafe(migrationSql);
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await sql.end();
    process.exit();
  }
}

applyMigration();
