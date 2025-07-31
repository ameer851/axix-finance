// verify-all-users.js - Mark all users as verified and active
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Set up PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/axixfinance';
const pool = new Pool({ connectionString });

// Ensure all users are marked as verified and active
async function updateAllUsersToVerified() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Update all users to be verified and active
    const result = await client.query(`
      UPDATE users 
      SET is_verified = true, is_active = true
    `);
    
    // Make sure there's at least one admin user
    const adminCheck = await client.query(`
      SELECT COUNT(*) FROM users WHERE role = 'admin'
    `);
    
    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log('⚠️ No admin user found, creating one...');
      await client.query(`
        INSERT INTO users (email, username, first_name, last_name, password, role, is_verified, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, ['admin@axixfinance.com', 'admin', 'Admin', 'User', 'admin', 'admin', true, true]);
      console.log('✅ Admin user created successfully');
    }
    
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const count = parseInt(userCount.rows[0].count);
    
    console.log(`✅ Updated ${count} users to be verified and active`);
    
    // Create audit log
    await client.query(`
      INSERT INTO logs (type, message, details) 
      VALUES ('audit', 'All users marked as verified and active', '{"action":"script_execution","script":"verify-all-users.js"}')
    `);
    
    console.log('✅ Created audit log to document the change');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

async function main() {
  console.log('🔧 Starting user verification update...');
  
  // Update all users in the database
  await updateAllUsersToVerified();
  
  console.log('\n🔧 Update complete! All users are now verified and active.');
}

main();
