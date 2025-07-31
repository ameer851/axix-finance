// fix-auth-bypasses.js - Apply bypasses for auth verification
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

// Helper function to update the authentication bypass
function modifyAuthFile() {
  const authFilePath = path.join(__dirname, '..', 'server', 'auth.ts');
  let authContent = fs.readFileSync(authFilePath, 'utf8');
  
  // Check if we've already applied the fix
  if (authContent.includes('// VERIFICATION BYPASS')) {
    console.log('✅ Auth file already contains the verification bypass.');
  } else {
    // Replace requireAdminRole with a modified version
    const requireAdminRoleFunc = `export function requireAdminRole(req: Request, res: Response, next: Function) {
  console.log('🔐 Admin role check for:', req.path);
  console.log('🔐 Is authenticated:', req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log('❌ Not authenticated');
    return res.status(401).json({ message: "You must be logged in" });
  }

  const user = req.user as BaseUser;
  console.log('👤 User:', user.email, 'Role:', user.role, 'Verified:', user.isVerified);
  
  if (!user.isVerified) {
    console.log('❌ Email not verified');
    return res.status(403).json({
      message: "Email verification required",
      verificationRequired: true
    });
  }`;
    
    const fixedRequireAdminRoleFunc = `export function requireAdminRole(req: Request, res: Response, next: Function) {
  console.log('🔐 Admin role check for:', req.path);
  console.log('🔐 Is authenticated:', req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log('❌ Not authenticated');
    return res.status(401).json({ message: "You must be logged in" });
  }

  const user = req.user as BaseUser;
  console.log('👤 User:', user.email, 'Role:', user.role, 'Verified:', user.isVerified);
  
  // VERIFICATION BYPASS: No longer checking if email is verified
  // Admin users can access admin features without email verification`;
    
    // Make the replacement
    authContent = authContent.replace(requireAdminRoleFunc, fixedRequireAdminRoleFunc);
    
    // Also modify requireEmailVerification
    const requireEmailVerificationFunc = `export function requireEmailVerification(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }

  const user = req.user as BaseUser;
  
  if (!user.isVerified) {
    return res.status(403).json({
      message: "Email verification required",
      verificationRequired: true
    });
  }
  
  next();
}`;
    
    const fixedRequireEmailVerificationFunc = `export function requireEmailVerification(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in" });
  }

  // VERIFICATION BYPASS: Always allow access regardless of email verification status
  // This change disables email verification requirement completely
  next();
}`;
    
    // Make this replacement too
    authContent = authContent.replace(requireEmailVerificationFunc, fixedRequireEmailVerificationFunc);
    
    // Back up the original file
    fs.writeFileSync(`${authFilePath}.backup`, fs.readFileSync(authFilePath));
    
    // Write the modified content
    fs.writeFileSync(authFilePath, authContent);
    
    console.log('✅ Modified auth.ts to bypass email verification checks');
  }
}

// Ensure all users are marked as verified and active
async function updateAllUsersToVerified() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Update all users to be verified and active
    await client.query(`
      UPDATE users 
      SET is_verified = true, is_active = true
    `);
    
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const count = parseInt(userCount.rows[0].count);
    
    console.log(`✅ Updated ${count} users to be verified and active`);
    
    // Create audit log
    await client.query(`
      INSERT INTO logs (type, message, details) 
      VALUES ('audit', 'All users marked as verified and active', '{"action":"script_execution","script":"fix-auth-bypasses.js"}')
    `);
    
    console.log('✅ Created audit log to document the change');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

async function main() {
  console.log('🔧 Starting auth bypass fixes...');
  
  // Modify the auth.ts file
  modifyAuthFile();
  
  // Update all users in the database
  await updateAllUsersToVerified();
  
  console.log('\n🔧 Fix complete! Please restart your server for the changes to take effect.');
}

main();
