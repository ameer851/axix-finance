// Email service for sending verification emails and other notifications
import { User } from "@shared/schema";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { DatabaseStorage } from "./storage";
import jwt from "jsonwebtoken";

// Create a storage instance
const storage = new DatabaseStorage();

// Set token expiration times
const TOKEN_EXPIRY = {
  VERIFICATION: 86400,  // 24 hours in seconds
  PASSWORD_RESET: 3600  // 1 hour in seconds
};

// JWT secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'carax-verification-secret';

// Create a reusable transporter with Nodemailer
let transporter: nodemailer.Transporter;

// Store Ethereal credentials for development testing
export let etherealAccount: {user: string, pass: string} | null = null;

// Initialize the email transporter
async function initializeEmailTransporter() {
  try {
    // Priority 1: Use Gmail SMTP if configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      console.log('Initializing email service with Gmail SMTP...');
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        debug: true, // Enable debugging
        logger: true  // Enable logging
      });
      
      // Test the connection
      await transporter.verify();
      console.log('✅ Gmail SMTP connection verified successfully!');
      console.log(`📧 Emails will be sent from: ${process.env.SMTP_USER}`);
      return;
      
    } else if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
      // Use existing Ethereal credentials from .env file
      console.log('Using existing Ethereal credentials from .env file...');
      etherealAccount = {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS
      };
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASS
        },
        debug: true,
        logger: true
      });
      
      console.log('\n===== ETHEREAL EMAIL CREDENTIALS =====');
      console.log('📧 Username:', process.env.ETHEREAL_USER);
      console.log('🔑 Password:', process.env.ETHEREAL_PASS);
      console.log('🌐 Web Interface: https://ethereal.email/login');
      console.log('Note: Use these credentials to login and view test emails');
      console.log('=======================================\n');
    } else {
      // For development/testing, create a new Ethereal test account
      console.log('Creating new Ethereal test account for email testing...');
      etherealAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass
        },
        debug: true,
        logger: true
      });
      
      console.log('\n===== NEW ETHEREAL EMAIL CREDENTIALS =====');
      console.log('📧 Username:', etherealAccount.user);
      console.log('🔑 Password:', etherealAccount.pass);
      console.log('🌐 Web Interface: https://ethereal.email/login');
      console.log('Note: Use these credentials to login and view test emails');
      console.log('Add these to your .env file to reuse:');
      console.log(`ETHEREAL_USER=${etherealAccount.user}`);
      console.log(`ETHEREAL_PASS=${etherealAccount.pass}`);
      console.log('=========================================\n');
    }
    
    console.log('Email transporter initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    throw error;
  }
}

// Generate a verification token
function generateVerificationToken(userId: number): string {
  const payload = { userId, type: 'verification' };
  const options = { expiresIn: TOKEN_EXPIRY.VERIFICATION };
  return jwt.sign(payload, JWT_SECRET, options);
}

// Generate a password reset token
function generatePasswordResetToken(userId: number): string {
  const payload = { userId, type: 'password_reset' };
  const options = { expiresIn: TOKEN_EXPIRY.PASSWORD_RESET };
  return jwt.sign(payload, JWT_SECRET, options);
}

// Verify a token
export function verifyToken(token: string): { userId: number; type: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, type: decoded.type };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Send email verification
export async function sendVerificationEmail(user: User): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeEmailTransporter();
    }

    const verificationToken = generateVerificationToken(user.id);
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@caraxfinance.com',
      to: user.email,
      subject: '🔐 CaraxFinance - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">CaraxFinance</h1>
              <p style="color: #64748b; margin: 5px 0 0 0; font-size: 16px;">Secure Financial Platform</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 24px;">Welcome to CaraxFinance! 🎉</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Hello <strong>${user.firstName || user.email}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Thank you for creating an account with CaraxFinance. To complete your registration and ensure the security of your account, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 5px rgba(37, 99, 235, 0.3);">
                ✅ Verify Email Address
              </a>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
              <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours for your security. If you didn't create this account, please ignore this email.
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
              If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; border: 1px solid #e2e8f0;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="text-align: center; color: #64748b; font-size: 14px;">
              <p style="margin: 5px 0;">
                Best regards,<br>
                <strong>The CaraxFinance Team</strong>
              </p>
              <p style="margin: 15px 0 5px 0; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log success
    if (etherealAccount) {
      console.log('📧 Verification email sent successfully!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('View at: https://ethereal.email/login');
    } else {
      console.log('📧 Verification email sent successfully to Gmail!');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(user: User): Promise<boolean> {
  try {
    if (!transporter) {
      await initializeEmailTransporter();
    }

    const resetToken = generatePasswordResetToken(user.id);
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@caraxfinance.com',
      to: user.email,
      subject: '🔐 CaraxFinance - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">CaraxFinance</h1>
              <p style="color: #64748b; margin: 5px 0 0 0; font-size: 16px;">Secure Financial Platform</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 24px;">Password Reset Request 🔒</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Hello <strong>${user.firstName || user.email}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset the password for your CaraxFinance account. If you made this request, click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 5px rgba(220, 38, 38, 0.3);">
                🔄 Reset Password
              </a>
            </div>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
              <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>⚠️ Security Alert:</strong> This password reset link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
              If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="background-color: #f8fafc; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; border: 1px solid #e2e8f0;">
              ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="text-align: center; color: #64748b; font-size: 14px;">
              <p style="margin: 5px 0;">
                Best regards,<br>
                <strong>The CaraxFinance Team</strong>
              </p>
              <p style="margin: 15px 0 5px 0; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log success
    if (etherealAccount) {
      console.log('📧 Password reset email sent successfully!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('View at: https://ethereal.email/login');
    } else {
      console.log('📧 Password reset email sent successfully to Gmail!');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

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
      from: process.env.SMTP_USER || 'noreply@caraxfinance.com',
      to: user.email,
      subject: `${isImportant ? '🚨 ' : '📢 '}CaraxFinance - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">CaraxFinance</h1>
              <p style="color: #64748b; margin: 5px 0 0 0; font-size: 16px;">Secure Financial Platform</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 24px;">${subject}</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Hello <strong>${user.firstName || user.email}</strong>,
            </p>
            
            <div style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              ${message}
            </div>
            
            ${isImportant ? `
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
              <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>⚠️ Important:</strong> This is an important notification regarding your CaraxFinance account. Please review the information above carefully.
              </p>
            </div>
            ` : ''}
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="text-align: center; color: #64748b; font-size: 14px;">
              <p style="margin: 5px 0;">
                Best regards,<br>
                <strong>The CaraxFinance Team</strong>
              </p>
              <p style="margin: 15px 0 5px 0; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log success
    if (etherealAccount) {
      console.log('📧 Notification email sent successfully!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('View at: https://ethereal.email/login');
    } else {
      console.log('📧 Notification email sent successfully to Gmail!');
    }
    
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
      from: process.env.SMTP_USER || 'noreply@axixfinance.com',
      to: user.email,
      subject: '🎉 Welcome to AxixFinance!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f3ef;">
          <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #a37c48; margin: 0; font-size: 28px;">AxixFinance</h1>
              <p style="color: #3f2c15; margin: 5px 0 0 0; font-size: 16px;">Secure Financial Platform</p>
            </div>
            <h2 style="color: #3f2c15; margin-bottom: 20px; font-size: 24px;">Welcome, ${user.firstName || user.email}!</h2>
            <p style="color: #3f2c15; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We're excited to have you join AxixFinance. Your account is now active and you can start exploring our platform's features.
            </p>
            <div style="background-color: #f5f3ef; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #a37c48;">
              <p style="color: #3f2c15; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>💡 Tip:</strong> Be sure to verify your email and set up your profile for the best experience.
              </p>
            </div>
            <div style="background-color: #e3d7c3; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #a37c48;">
              <p style="color: #a37c48; font-size: 15px; margin: 0;">
                <strong>Your Login Details:</strong><br>
                Email: <span style="font-family: monospace; color: #3f2c15;">${user.email}</span><br>
                Password: <span style="font-family: monospace; color: #3f2c15;">${password ? password : '[Set during registration or via password reset]'} </span>
              </p>
            </div>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${process.env.CLIENT_URL || 'https://axix-finance.com'}" 
                 style="background-color: #a37c48; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 5px rgba(163, 124, 72, 0.15);">
                Go to AxixFinance
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <div style="text-align: center; color: #3f2c15; font-size: 14px;">
              <p style="margin: 5px 0;">
                Best regards,<br>
                <strong>The AxixFinance Team</strong>
              </p>
              <p style="margin: 15px 0 5px 0; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    if (etherealAccount) {
      console.log('📧 Welcome email sent successfully!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('View at: https://ethereal.email/login');
    } else {
      console.log('📧 Welcome email sent successfully to Gmail!');
    }
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// Initialize email service when module is loaded
initializeEmailTransporter().catch(error => {
  console.error('Failed to initialize email service:', error);
});