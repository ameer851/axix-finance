// Create CaraxFinance database
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Parse the connection string to get individual parts
const url = process.env.DATABASE_URL;
const matches = url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (!matches) {
  console.error('Invalid connection string format');
  process.exit(1);
}

const user = matches[1];
const password = matches[2];
const host = matches[3];
const port = matches[4];
const targetDbName = matches[5];

console.log(`Attempting to create database: ${targetDbName}`);

// Connect to the 'postgres' default database first
const connectionString = `postgres://${user}:${password}@${host}:${port}/postgres`;
const pool = new Pool({ connectionString });

async function createDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL server');
    
    // Check if database already exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`Database '${targetDbName}' already exists`);
    } else {
      // Create the database
      // Note: We have to use string interpolation here because
      // PostgreSQL doesn't support parameter binding for database names
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database '${targetDbName}' created successfully!`);
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

createDatabase();
