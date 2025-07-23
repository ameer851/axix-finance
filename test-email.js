// Quick email service test
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailService() {
  console.log('Testing email service configuration...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'Not set');
  
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      debug: true,
      logger: true
    });

    // Verify connection
    const verification = await transporter.verify();
    console.log('✅ SMTP connection verified:', verification);

    // Send test email
    const testEmail = {
      from: process.env.EMAIL_FROM || '"Axix Finance" <noreply@axix-finance.co>',
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: 'Axix Finance - Email Service Test',
      text: 'This is a test email to verify the email service is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Service Test</h2>
          <p>✅ Email service is working correctly!</p>
          <p>Date: ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

  } catch (error) {
    console.error('❌ Email service test failed:', error);
  }
}

testEmailService();
