// fix-admin.js - Ensures admin user exists and has proper permissions
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

// Admin user details
const adminUser = {
  email: 'admin@axixfinance.com',
  username: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  password: 'admin',
  role: 'admin',
  isVerified: true,
  isActive: true
};

// Update or create the admin user
async function updateAdminUser() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if admin user exists
    const userCheck = await client.query(`
      SELECT id, email, role FROM users WHERE email = $1
    `, [adminUser.email]);
    
    // Hash the password - we're going to use plain password field in this schema
    const hashedPassword = adminUser.password; // In a real app, this would be hashed
    
    if (userCheck.rows.length > 0) {
      // Update existing admin user
      const adminId = userCheck.rows[0].id;
      
      await client.query(`
        UPDATE users 
        SET role = $1, is_verified = $2, is_active = $3, password = $4, 
            username = $5, first_name = $6, last_name = $7
        WHERE id = $8
      `, [adminUser.role, adminUser.isVerified, adminUser.isActive, hashedPassword, 
          adminUser.username, adminUser.firstName, adminUser.lastName, adminId]);
      
      console.log(`✅ Admin user updated successfully`);
    } else {
      // Create new admin user
      await client.query(`
        INSERT INTO users (email, username, first_name, last_name, password, role, is_verified, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [adminUser.email, adminUser.username, adminUser.firstName, adminUser.lastName, 
          hashedPassword, adminUser.role, adminUser.isVerified, adminUser.isActive]);
      
      console.log(`✅ Admin user created successfully`);
    }
    
    // Create audit log
    await client.query(`
      INSERT INTO logs (type, message, details) 
      VALUES ('audit', 'Admin user updated', '{"action":"script_execution","script":"fix-admin.js"}')
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
  console.log('🔧 Starting admin user update...');
  
  // Update the admin user
  await updateAdminUser();
  
  console.log('\n🔧 Update complete! Admin user is ready to use.');
  console.log('🔑 Login with:', adminUser.email, '/', adminUser.password);
}

main();
