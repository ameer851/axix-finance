// Simple test to check if emails are working
import { sendDepositRequestEmail, sendWithdrawalRequestEmail } from './server/emailService.js';

// Test user data
const testUser = {
  id: 16,
  email: 'test@example.com', // Replace with your actual email to test
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  balance: '1000',
  role: 'user',
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  twoFactorEnabled: false,
  referredBy: null,
  twoFactorSecret: null,
  verificationToken: null,
  verificationTokenExpiry: null,
  passwordResetToken: null,
  passwordResetTokenExpiry: null,
  password: ''
};

async function testEmails() {
  console.log('🧪 Testing email service...');
  
  try {
    console.log('📧 Testing deposit request email...');
    const depositResult = await sendDepositRequestEmail(testUser, '100', 'bitcoin', 'STARTER PLAN');
    console.log('Deposit email result:', depositResult ? '✅ Success' : '❌ Failed');
    
    console.log('📧 Testing withdrawal request email...');
    const withdrawalResult = await sendWithdrawalRequestEmail(testUser, '50', '127.0.0.1');
    console.log('Withdrawal email result:', withdrawalResult ? '✅ Success' : '❌ Failed');
    
  } catch (error) {
    console.error('💥 Email test failed:', error.message);
  }
}

testEmails();
