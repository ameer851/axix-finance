import { DatabaseStorage } from '../server/storage.js';
import { hashPassword } from '../server/auth.js';

async function updateAdminPassword() {
  try {
    const storage = new DatabaseStorage();
    console.log('🔐 Updating admin user password...');
    
    const user = await storage.getUserByUsername('admin');
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    // Hash the password
    const hashedPassword = await hashPassword('admin123');
    
    // Update admin user password and verification status
    const updatedUser = await storage.updateUser(user.id, {
      password: hashedPassword,
      isVerified: true  // Ensure admin is verified
    });
    
    if (updatedUser) {
      console.log('✅ Admin password updated successfully!');
      console.log('📧 Email: admin@caraxfinance.com');
      console.log('👤 Username: admin');
      console.log('🔑 Password: admin123');
      console.log('🛡️  Role:', updatedUser.role);
      console.log('✨ Verified:', updatedUser.isVerified);
      console.log('\n🎯 You can now log in to the admin panel at /admin');
    } else {
      console.log('❌ Failed to update admin password');
    }
  } catch (error) {
    console.error('❌ Error updating admin password:', error.message);
  }
}

updateAdminPassword();
