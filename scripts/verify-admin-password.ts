import { DatabaseStorage } from '../server/storage.js';
import { comparePasswords } from '../server/auth.js';

async function verifyAdminPassword() {
  try {
    const storage = new DatabaseStorage();
    console.log('🔍 Checking admin user password...');
    
    const user = await storage.getUserByUsername('admin');
    
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('👤 Admin user found:');
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Is Active:', user.isActive);
    console.log('- Is Verified:', user.isVerified);
    console.log('- Stored Password:', user.password);
    console.log('- Password looks hashed:', user.password.includes('.'));
    
    // Test password comparison
    const testPassword = 'admin123';
    
    // Test direct comparison
    const directMatch = user.password === testPassword;
    console.log('🔑 Direct password match:', directMatch);
    
    // Test hash comparison if password is hashed
    if (user.password.includes('.')) {
      try {
        const hashMatch = await comparePasswords(testPassword, user.password);
        console.log('🔐 Hash password match:', hashMatch);
      } catch (error) {
        console.error('🚨 Hash comparison error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking admin password:', error.message);
  }
}

verifyAdminPassword();
