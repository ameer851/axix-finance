import { DatabaseStorage } from '../server/storage.js';
import { hashPassword } from '../server/auth.js';

async function createAdminUser() {
  try {
    const storage = new DatabaseStorage();
    console.log('🔐 Creating admin user...');
    
    // Try to delete existing admin user first
    try {
      const existingUser = await storage.getUserByUsername('admin');
      if (existingUser) {
        await storage.deleteUser(existingUser.id);
        console.log('🗑️  Deleted existing admin user');
      }
    } catch (error) {
      console.log('ℹ️  No existing admin user to delete');
    }
    
    // Hash the password
    const hashedPassword = await hashPassword('admin123');
    
    // Create admin user
    const adminUser = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@caraxfinance.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      balance: '0',
      isVerified: true,
      isActive: true,
      twoFactorEnabled: false
    });
    
    if (adminUser) {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@caraxfinance.com');
      console.log('👤 Username: admin');
      console.log('🔑 Password: admin123');
      console.log('🛡️  Role:', adminUser.role);
      console.log('✨ Verified:', adminUser.isVerified);
      console.log('\n🎯 You can now log in to the admin panel at /admin');
    } else {
      console.log('❌ Failed to create admin user');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

createAdminUser();
