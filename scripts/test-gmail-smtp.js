const nodemailer = require('nodemailer');
require('dotenv').config();

async function testGmailSMTP() {
  console.log('🔍 Testing Gmail SMTP Configuration...\n');
  
  // Show current configuration
  console.log('Current Settings:');
  console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`🔌 SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`👤 SMTP User: ${process.env.SMTP_USER}`);
  console.log(`🔑 SMTP Password: ${process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'Not set'}`);
  console.log(`📮 Email From: ${process.env.EMAIL_FROM}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
  
  // Check if Gmail configuration
  if (process.env.SMTP_HOST !== 'smtp.gmail.com') {
    console.log('⚠️  Not configured for Gmail SMTP');
    console.log('💡 Update your .env file with Gmail settings');
    return;
  }
  
  // Check required fields
  const required = ['SMTP_USER', 'SMTP_PASSWORD'];
  const missing = required.filter(field => !process.env[field] || process.env[field].includes('your-gmail'));
  
  if (missing.length > 0) {
    console.log('❌ Missing required Gmail configuration:');
    missing.forEach(field => console.log(`   - ${field}`));
    console.log('\n📋 Follow the setup guide in docs/gmail-smtp-setup.md');
    return;
  }
  
  try {
    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
    
    console.log('🔗 Testing connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!\n');
    
    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = {
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // Send to yourself
      subject: '✅ Axix Finance - Production Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Email Service Successfully Configured!</h2>
          <p>Congratulations! Your Axix Finance application is now using Gmail SMTP for production emails.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Configuration Details:</h3>
            <ul>
              <li><strong>Provider:</strong> Gmail SMTP</li>
              <li><strong>Environment:</strong> ${process.env.NODE_ENV}</li>
              <li><strong>From Address:</strong> ${process.env.EMAIL_FROM}</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p style="color: #059669;"><strong>✅ Your email service is ready for production!</strong></p>
          
          <p style="font-size: 14px; color: #6b7280;">
            This test email was sent automatically to verify your email configuration.
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log(`📥 Check your inbox at: ${process.env.SMTP_USER}\n`);
    
    console.log('🎉 Gmail SMTP Setup Complete!');
    console.log('💡 Your application is now ready to send production emails.');
    
  } catch (error) {
    console.log('❌ Gmail SMTP Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have 2-Factor Authentication enabled on Gmail');
    console.log('2. Generate a new App Password from Google Account settings');
    console.log('3. Use the App Password (not your regular Gmail password)');
    console.log('4. Check that your Gmail address is correct');
    console.log('\n📖 See full guide: docs/gmail-smtp-setup.md');
  }
}

testGmailSMTP();
