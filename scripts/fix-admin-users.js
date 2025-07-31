// fix-admin-users.js - Makes sure admin user exists and all users are verified
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import bcrypt from 'bcrypt';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Set up PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/axixfinance';
const pool = new Pool({ connectionString });

// Helper function to hash a password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Update or create admin user
async function ensureAdminUser() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if admin user exists
    const adminCheckResult = await client.query(`
      SELECT * FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    // Hash the admin password
    const hashedPassword = await hashPassword('admin');
    
    if (adminCheckResult.rows.length === 0) {
      console.log('⚠️ No admin user found, creating one...');
      
      // Check what fields are available in the users table
      const tableInfoResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      
      const tableColumns = tableInfoResult.rows.map(row => row.column_name);
      console.log('📋 Available user table columns:', tableColumns.join(', '));
      
      // Build insert based on available columns
      const columns = [];
      const values = [];
      const placeholders = [];
      let i = 1;
      
      // Required fields
      if (tableColumns.includes('email')) {
        columns.push('email');
        values.push('admin@axixfinance.com');
        placeholders.push(`$${i++}`);
      }
      
      if (tableColumns.includes('password')) {
        columns.push('password');
        values.push(hashedPassword);
        placeholders.push(`$${i++}`);
      }
      
      if (tableColumns.includes('role')) {
        columns.push('role');
        values.push('admin');
        placeholders.push(`$${i++}`);
      }
      
      // Optional fields - add if they exist
      if (tableColumns.includes('username')) {
        columns.push('username');
        values.push('admin');
        placeholders.push(`$${i++}`);
      }
      
      if (tableColumns.includes('first_name')) {
        columns.push('first_name');
        values.push('Admin');
        placeholders.push(`$${i++}`);
      }
      
      if (tableColumns.includes('last_name')) {
        columns.push('last_name');
        values.push('User');
        placeholders.push(`$${i++}`);
      }
      
      if (tableColumns.includes('is_verified')) {
        columns.push('is_verified');
        values.push(true);
        placeholders.push(`$${i++}`);
      }
      
      if (tableColumns.includes('is_active')) {
        columns.push('is_active');
        values.push(true);
        placeholders.push(`$${i++}`);
      }
      
      // Insert the admin user
      const insertQuery = `
        INSERT INTO users (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id
      `;
      
      const insertResult = await client.query(insertQuery, values);
      console.log('✅ Admin user created successfully with ID:', insertResult.rows[0].id);
      
    } else {
      console.log('✅ Admin user exists, updating password and ensuring verified status...');
      
      // Update the admin user
      const updateResult = await client.query(`
        UPDATE users
        SET 
          password = $1,
          is_verified = true,
          is_active = true
        WHERE role = 'admin'
        RETURNING id
      `, [hashedPassword]);
      
      console.log('✅ Admin user updated successfully with ID:', updateResult.rows[0].id);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
  }
}

// Ensure all users are verified and active
async function verifyAllUsers() {
  let client;
  
  try {
    client = await pool.connect();
    
    // Update all users to be verified and active
    const result = await client.query(`
      UPDATE users 
      SET is_verified = true, is_active = true
    `);
    
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const count = parseInt(userCount.rows[0].count);
    
    console.log(`✅ Updated ${count} users to be verified and active`);
    
    // Create audit log if logs table exists
    try {
      await client.query(`
        INSERT INTO logs (type, message, details) 
        VALUES ('audit', 'All users marked as verified and active', '{"action":"script_execution","script":"fix-admin-users.js"}')
      `);
      console.log('✅ Created audit log to document the change');
    } catch (error) {
      console.log('⚠️ Could not create audit log, logs table might not exist');
    }
    
  } catch (error) {
    console.error('❌ Error verifying users:', error);
  } finally {
    if (client) client.release();
  }
}

// Fix or create visitor_tracking table if needed
async function ensureVisitorTrackingTable() {
  let client;
  
  try {
    client = await pool.connect();
    
    // Check if visitor_tracking table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'visitor_tracking'
      )
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('⚠️ visitor_tracking table does not exist, creating it...');
      
      // Create the visitor_tracking table
      await client.query(`
        CREATE TABLE visitor_tracking (
          id SERIAL PRIMARY KEY,
          visitor_id VARCHAR(255) NOT NULL,
          user_id INTEGER,
          page VARCHAR(255),
          referrer VARCHAR(255),
          ip_address VARCHAR(255),
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      // Add index for faster queries
      await client.query(`
        CREATE INDEX visitor_tracking_created_at_idx ON visitor_tracking (created_at)
      `);
      
      console.log('✅ Created visitor_tracking table');
      
      // Add some sample data
      await client.query(`
        INSERT INTO visitor_tracking (visitor_id, page, ip_address, created_at)
        VALUES 
          ('sample-visitor-1', '/dashboard', '127.0.0.1', NOW()),
          ('sample-visitor-2', '/login', '127.0.0.2', NOW()),
          ('sample-visitor-3', '/', '127.0.0.3', NOW())
      `);
      
      console.log('✅ Added sample visitor data');
    } else {
      console.log('✅ visitor_tracking table exists');
    }
    
  } catch (error) {
    console.error('❌ Error checking/creating visitor_tracking table:', error);
  } finally {
    if (client) client.release();
  }
}

async function main() {
  console.log('🔧 Starting admin user and verification setup...');
  
  try {
    // Ensure admin user exists
    await ensureAdminUser();
    
    // Verify all users
    await verifyAllUsers();
    
    // Ensure visitor tracking table exists
    await ensureVisitorTrackingTable();
    
    console.log('\n🔧 Setup complete! All users are now verified and active.');
    console.log('🔑 Admin user is set up with email: admin@axixfinance.com and password: admin');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

main();
