// Email service for sending emails using templates
import { User } from "@shared/schema";
import nodemailer from "nodemailer";
import {
  generateDepositApprovalEmailHTML,
  generateWelcomeEmailHTML,
  generateDepositConfirmationEmailHTML,
  generateWithdrawalRequestEmailHTML,
  generateWithdrawalConfirmationEmailHTML,
  generateNotificationEmailHTML
} from './emailTemplates';

// Create a reusable transporter with Nodemailer
let transporter: nodemailer.Transporter;

// Store Ethereal credentials for development testing
export let etherealAccount: {user: string, pass: string} | null = null;

/**
 * Get the configured 'from' email address
 * @returns {string} The email address to use in the 'from' field
 */
function getFromEmail(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@axixfinance.com';
}

/**
 * Check if email service is properly configured
 * @returns {boolean} Whether email service is configured
 */
export function isConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD));
}

// Initialize the email transporter
export async function initializeEmailTransporter(): Promise<boolean> {
  try {
    // Priority 1: Use Resend SMTP if configured
    if (process.env.RESEND_API_KEY) {
      console.log('Initializing email service with Resend SMTP...');
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: 'resend', // Resend SMTP username is always 'resend'
          pass: process.env.RESEND_API_KEY // Using the API key as password
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        debug: false,
        logger: false
      });
      
      // Test the connection
      await transporter.verify();
      console.log('✅ Resend SMTP connection verified successfully!');
      console.log(`📧 Emails will be sent from: ${process.env.EMAIL_FROM || 'noreply@axixfinance.com'}`);
      return true;
      
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      // Priority 2: Use Gmail SMTP if configured
      console.log('Initializing email service with Gmail SMTP...');
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        debug: false,
        logger: false
      });
      
      await transporter.verify();
      console.log('✅ Gmail SMTP connection verified successfully!');
      console.log(`📧 Emails will be sent from: ${process.env.SMTP_USER}`);
      return true;
      
    } else {
      console.warn('⚠️  No email service configured!');
      console.warn('To send emails, configure one of the following:');
      console.warn('1. Resend: Set RESEND_API_KEY and EMAIL_FROM in your .env file');
      console.warn('2. Gmail SMTP: Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in your .env file');
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    return false;
  }
}

// Email verification removed as requested

// Send password reset email
// Send general notification email
export async function sendNotificationEmail(
  user: User,
  subject: string,
  message: string,
  isImportant: boolean = false
): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeEmailTransporter();
    }

    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: `${isImportant ? '🚨 ' : '📢 '}Axix Finance - ${subject}`,
      html: generateNotificationEmailHTML(user, subject, message, isImportant ? 'Important: Please review this message carefully.' : undefined)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Notification email sent successfully!');
    return true;
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return false;
  }
}

// Send welcome email to new users
export async function sendWelcomeEmail(user: User, password?: string): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeEmailTransporter();
    }

    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: 'Welcome to Axix Finance',
      html: generateWelcomeEmailHTML(user, password || 'YOUR-TEMPORARY-PASSWORD')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Welcome email sent successfully!');
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send deposit request notification email
 */
export async function sendDepositRequestEmail(user: User, amount: string, method: string, planName?: string): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeEmailTransporter();
    }

    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: ' Axix Finance - Deposit Request Received',
      html: generateDepositConfirmationEmailHTML(user, parseFloat(amount), method, '', planName)
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Deposit request email sent successfully!');
    return true;
  } catch (error) {
    console.error('Failed to send deposit request email:', error);
    return false;
  }
}

/**
 * Send deposit approved notification email
 */
export async function sendDepositApprovedEmail(user: User, amount: string, method: string, planName?: string): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeEmailTransporter();
    }

    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: 'Axix Finance - Deposit Approved & Confirmed',
      html: generateDepositApprovalEmailHTML(user, parseFloat(amount), method, planName)
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Deposit approval email sent successfully!');
    return true;
  } catch (error) {
    console.error('Failed to send deposit approved email:', error);
    return false;
  }
}

/**
 * Send withdrawal request notification email
 */
export async function sendWithdrawalRequestEmail(user: User, amount: string, ipAddress?: string): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeEmailTransporter();
    }

    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: ' Axix Finance - Withdrawal Request Received',
      html: generateWithdrawalRequestEmailHTML(user, parseFloat(amount), 'USD', 'Your crypto wallet', ipAddress)
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Withdrawal request email sent successfully!');
    return true;
  } catch (error) {
    console.error('Failed to send withdrawal request email:', error);
    return false;
  }
}

/**
 * Send withdrawal approved notification email
 */
export async function sendWithdrawalApprovedEmail(user: User, amount: string, cryptoAccount: string): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeEmailTransporter();
    }

    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: ' Axix Finance - Withdrawal Successfully Processed',
      html: generateWithdrawalConfirmationEmailHTML(user, parseFloat(amount), 'USD', cryptoAccount)
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Withdrawal approval email sent successfully!');
    return true;
  } catch (error) {
    console.error('Failed to send withdrawal approved email:', error);
    return false;
  }
}

// Initialize email service when module is loaded
initializeEmailTransporter().catch(error => {
  console.error('Failed to initialize email service:', error);
});

// Initialize email service when module is loaded
initializeEmailTransporter().catch(error => {
  console.error('Failed to initialize email service:', error);
});
