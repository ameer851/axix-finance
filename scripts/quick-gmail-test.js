const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('=== GMAIL SMTP TEST ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('SMTP Host:', process.env.SMTP_HOST);
console.log('SMTP User:', process.env.SMTP_USER);
console.log('SMTP Password set:', !!process.env.SMTP_PASSWORD);

async function quickTest() {
  try {
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'aliyuamir607@gmail.com',
        pass: 'gneq baka zsjn edto'
      }
    });
    
    console.log('Testing connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: 'support@axix-finance.com',
      to: 'aliyuamir607@gmail.com',
      subject: 'Axix Finance - Production Email Test',
      text: 'Your production email service is working! 🎉'
    });
    
    console.log('✅ Test email sent!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

quickTest();
