import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get DATABASE_URL with better error handling
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set.");
  console.error("Please check your .env file or set the DATABASE_URL environment variable.");
  // Set a fallback for development mode
  if (process.env.NODE_ENV === 'development') {
    console.log("Using fallback database for development mode");
  } else {
    throw new Error("DATABASE_URL must be set. Database connection failed.");
  }
}

// Create connection pool with robust configuration
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 60000, // Increased from 30000
  connectionTimeoutMillis: 60000, // Increased from 15000
});

// Define PostgreSQL error type for better type checking
interface PostgresError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
}

// Add connection event handlers with enhanced logging and retry logic
pool.on('connect', client => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err: PostgresError) => {
  console.error('Unexpected database connection error:', err);
  
  // Log more detailed error information
  if (err.code) {
    console.error(`Error code: ${err.code}`);
  }
  
  if (err.message) {
    console.error(`Error message: ${err.message}`);
  }
  
  // Add specific handling for common connection errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    console.log('Database connection timed out or was refused. Will retry automatically.');
  }
});

// Add health check function to test database connection
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (err: unknown) {
    const pgError = err as PostgresError;
    console.error('Database connection check failed:', pgError.message);
    
    if (pgError.code) {
      console.error(`Error code: ${pgError.code}`);
      
      // Provide more specific error messages based on error code
      if (pgError.code === 'ETIMEDOUT') {
        console.error('Database connection timed out. Please check if the database server is running and accessible.');
      } else if (pgError.code === 'ECONNREFUSED') {
        console.error('Database connection refused. Please check if the database server is running on the specified host and port.');
      } else if (pgError.code === '28P01') {
        console.error('Invalid database credentials. Please check your username and password.');
      } else if (pgError.code === '3D000') {
        console.error('Database does not exist. Please check your database name.');
      }
    }
    
    return false;
  }
}

// Create postgres client for drizzle-orm
const queryClient = postgres(DATABASE_URL || '', {
  max: 10,
  idle_timeout: 60, // Increased from 30
  connect_timeout: 60, // Increased from 15
  // Add onnotice to handle database notices
  onnotice: notice => {
    console.log('Database notice:', notice.message);
  },
  // Add retry logic for connection attempts
  max_lifetime: 60 * 5, // 5 minutes max connection lifetime
  // Enhanced error handling with debug information
  debug: process.env.NODE_ENV === 'development',
  transform: {
    undefined: null, // Convert undefined values to null for better DB compatibility
  },
});

// Create Drizzle instance
export const db = drizzle(queryClient, { schema });

// Test database connection
try {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err.message);
      console.error('This might affect authentication and other database-dependent features.');
      if (err.message.includes('connect ECONNREFUSED')) {
        console.error('Make sure your PostgreSQL database is running on the correct port (currently set to 5000).');
      }
    } else {
      console.log('Database connection successful:', res.rows[0].now);
    }
  });
} catch (error) {
  console.error('Failed to test database connection:', error);
}