import { User } from "../shared/schema";
import { sendVerificationEmail, generateSecureToken } from "./emailService";

async function testEmailService() {
  // Test user
  const testUser = {
    id: 999,
    email: "test@example.com",
    firstName: "Test",
    lastName: "User"
  } as User;
  
  // Generate a token
  const token = generateSecureToken(testUser.id, 'verification');
  
  console.log("Sending test email...");
  
  try {
    await sendVerificationEmail(testUser, token);
    console.log("Test email sent successfully!");
    console.log("Check the Ethereal inbox or Brevo logs depending on your NODE_ENV setting.");
  } catch (error) {
    console.error("Failed to send test email:", error);
  }
}

// Run the test
testEmailService();

// Test script for email service
import { initializeEmailTransporter, sendTestEmail } from './emailService';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmailService() {
  try {
    console.log('Initializing email transporter...');
    await initializeEmailTransporter();
    
    console.log('Sending test email...');
    const recipient = process.env.TEST_EMAIL || 'test@example.com';
    
    await sendTestEmail(recipient, 'Test Email from CaraxFinance', 'This is a test email from the CaraxFinance system.');
    
    console.log('Test email sent successfully!');
    console.log('Check the Ethereal inbox at https://ethereal.email/login');
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

// Run the test
testEmailService().catch(console.error);