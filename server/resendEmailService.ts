// Email service using Resend for sending verification emails and other notifications
import { User } from "@shared/schema";
import { Resend } from 'resend';
import { DatabaseStorage } from "./storage";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import * as EmailTemplates from './emailTemplates';

// Create a storage instance
const storage = new DatabaseStorage();

// Set token expiration times
const TOKEN_EXPIRY = {
  VERIFICATION: 86400,  // 24 hours in seconds
  PASSWORD_RESET: 3600  // 1 hour in seconds
};

// JWT secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'carax-verification-secret';

// Initialize the Resend API client with API key if available
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;
// Initialize Resend SMTP transporter
let resendSmtpTransporter: nodemailer.Transporter | null = null;

try {
  if (resendApiKey) {
    resend = new Resend(resendApiKey);
    console.log('📧 Resend client initialized with API key');
    
    // Initialize Resend SMTP transporter
    resendSmtpTransporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587, // Using STARTTLS
      secure: false,
      auth: {
        user: 'resend', // Resend SMTP username is always 'resend'
        pass: resendApiKey // Using the same API key
      }
    });
    console.log('📧 Resend SMTP transporter initialized');
  }
} catch (error) {
  console.error('❌ Error initializing Resend client:', error);
}

// Default from address for emails
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'AxixFinance';

/**
 * Helper function to safely call Resend API
 * @returns The Resend instance or throws an error if not initialized
 */
function getResend(): Resend {
  if (!resend) {
    throw new Error('Resend client not initialized');
  }
  return resend;
}

/**
 * Check if Resend is properly configured
 * @returns {boolean} Whether Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!resendApiKey && (!!resend || !!resendSmtpTransporter);
}

/**
 * Check if Resend SMTP is configured
 * @returns {boolean} Whether Resend SMTP is configured
 */
export function isResendSmtpConfigured(): boolean {
  return !!resendApiKey && !!resendSmtpTransporter;
}

// Validate that Resend API key is available
export async function validateEmailSetup(): Promise<boolean> {
  if (!isResendConfigured()) {
    console.error('❌ Resend API key is not configured or client initialization failed.');
    return false;
  }
  
  // Try API first
  if (resend) {
    try {
      // Test that we can use the Resend API
      const domains = await resend.domains.list();
      
      if (domains && domains.data) {
        console.log('✅ Resend API connection verified successfully!');
        console.log(`📧 Resend API connected successfully`);
        return true;
      } else {
        console.error('❌ Could not verify Resend API connection, will try SMTP fallback');
      }
    } catch (error) {
      console.error('❌ Failed to connect to Resend API:', error);
      console.log('🔄 Trying Resend SMTP fallback...');
    }
  }
  
  // Try SMTP fallback if API fails
  if (resendSmtpTransporter) {
    try {
      // Test the SMTP connection
      const smtpVerified = await resendSmtpTransporter.verify();
      if (smtpVerified) {
        console.log('✅ Resend SMTP connection verified successfully!');
        console.log(`📧 Using Resend SMTP as fallback`);
        return true;
      } else {
        console.error('❌ Could not verify Resend SMTP connection');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to connect to Resend SMTP:', error);
      return false;
    }
  } else {
    console.error('❌ Resend SMTP transporter is not initialized');
    return false;
  }
  
  return false;
}

// Run validation on startup
validateEmailSetup().catch(err => {
  console.error('Email setup validation error:', err);
});



// Send email using Resend SMTP
async function sendEmailViaResendSMTP(
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    if (!resendSmtpTransporter) {
      console.error('❌ Resend SMTP transporter is not initialized');
      return false;
    }
    
    const mailOptions = {
      from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };
    
    const info = await resendSmtpTransporter.sendMail(mailOptions);
    console.log('📧 Email sent via Resend SMTP:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email via Resend SMTP:', error);
    return false;
  }
}

// Create and send a verification email
export async function sendVerificationEmail(
  user: User,
  token: string
): Promise<boolean> {
  try {
    // Generate verification URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    // Generate email HTML content using templates
    const htmlContent = EmailTemplates.generateVerificationEmailHTML(user, verificationUrl);
    
    let success = false;
    let emailId: string | undefined;
    
    // Try sending with Resend API first
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
          to: user.email,
          subject: 'Verify Your Email Address',
          html: htmlContent,
        });
        
        if (!error && data?.id) {
          console.log(`✅ Verification email sent to ${user.email} via Resend API, ID: ${data.id}`);
          emailId = data.id;
          success = true;
        } else {
          console.error('❌ Failed to send verification email via Resend API:', error);
          console.log('🔄 Trying Resend SMTP fallback...');
        }
      } catch (apiError) {
        console.error('❌ Error with Resend API:', apiError);
        console.log('🔄 Trying Resend SMTP fallback...');
      }
    }
    
    // If API fails, try SMTP
    if (!success) {
      success = await sendEmailViaResendSMTP(
        user.email,
        'Verify Your Email Address',
        htmlContent
      );
      
      if (success) {
        console.log(`✅ Verification email sent to ${user.email} via Resend SMTP`);
      }
    }
    
    // Log the verification email for audit purposes if either method succeeded
    if (success) {
      await storage.createLog({
        type: "info",
        message: `Verification email sent to ${user.email}`,
        userId: user.id,
        details: {
          emailId: emailId,
          token: process.env.NODE_ENV === 'production' ? undefined : token,
          verificationUrl: process.env.NODE_ENV === 'production' ? undefined : verificationUrl
        }
      }).catch(err => console.error('Failed to log verification email:', err));
    }
    
    return success;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Send a welcome email after verification
export async function sendWelcomeEmail(user: User, password?: string): Promise<boolean> {
  try {
    // Generate email HTML content using templates
    const htmlContent = EmailTemplates.generateWelcomeEmailHTML(user, 'YOUR-TEMPORARY-PASSWORD');
    
    let success = false;
    
    // Try sending with Resend API first
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
          to: user.email,
          subject: 'Welcome to AxixFinance!',
          html: htmlContent,
        });
        
        if (!error && data?.id) {
          console.log(`✅ Welcome email sent to ${user.email} via Resend API, ID: ${data.id}`);
          success = true;
        } else {
          console.error('❌ Failed to send welcome email via Resend API:', error);
          console.log('🔄 Trying Resend SMTP fallback...');
        }
      } catch (apiError) {
        console.error('❌ Error with Resend API:', apiError);
        console.log('🔄 Trying Resend SMTP fallback...');
      }
    }
    
    // If API fails, try SMTP
    if (!success) {
      success = await sendEmailViaResendSMTP(
        user.email,
        'Welcome to AxixFinance!',
        htmlContent
      );
      
      if (success) {
        console.log(`✅ Welcome email sent to ${user.email} via Resend SMTP`);
      }
    }
    
    return success;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

// Send a password reset email
export async function sendPasswordResetEmail(user: User, token: string): Promise<boolean> {
  try {
    // Generate reset URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    // Generate email HTML content using templates
    const htmlContent = EmailTemplates.generatePasswordResetEmailHTML(user, resetUrl);
    
    let success = false;
    let emailId: string | undefined;
    
    // Try sending with Resend API first
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
          to: user.email,
          subject: 'Reset Your Password',
          html: htmlContent,
        });
        
        if (!error && data?.id) {
          console.log(`✅ Password reset email sent to ${user.email} via Resend API, ID: ${data.id}`);
          emailId = data.id;
          success = true;
        } else {
          console.error('❌ Failed to send password reset email via Resend API:', error);
          console.log('🔄 Trying Resend SMTP fallback...');
        }
      } catch (apiError) {
        console.error('❌ Error with Resend API:', apiError);
        console.log('🔄 Trying Resend SMTP fallback...');
      }
    }
    
    // If API fails, try SMTP
    if (!success) {
      success = await sendEmailViaResendSMTP(
        user.email,
        'Reset Your Password',
        htmlContent
      );
      
      if (success) {
        console.log(`✅ Password reset email sent to ${user.email} via Resend SMTP`);
      }
    }
    
    // Log the password reset email for audit purposes if either method succeeded
    if (success) {
      await storage.createLog({
        type: "info",
        message: `Password reset email sent to ${user.email}`,
        userId: user.id,
        details: {
          emailId: emailId,
          token: process.env.NODE_ENV === 'production' ? undefined : token,
          resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl
        }
      }).catch(err => console.error('Failed to log password reset email:', err));
    }
    
    return success;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

// Send a deposit confirmation email
export async function sendDepositConfirmationEmail(
  user: User,
  amount: number,
  currency: string,
  txHash: string
): Promise<boolean> {
  try {
    // Send email with Resend
    const { data, error } = await getResend().emails.send({
      from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
      to: user.email,
      subject: 'Deposit Confirmation',
      html: EmailTemplates.generateDepositConfirmationEmailHTML(user, amount, currency, txHash),
    });
    
    if (error) {
      console.error('Failed to send deposit confirmation email:', error);
      return false;
    }
    
    console.log(`✅ Deposit confirmation email sent to ${user.email}, ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Error sending deposit confirmation email:', error);
    return false;
  }
}

// Create a verification token for a user
export function createVerificationToken(userId: number, email: string): string {
  // Create JWT token for email verification
  const token = jwt.sign(
    { 
      userId, 
      email, 
      purpose: 'email-verification'
    }, 
    JWT_SECRET, 
    { expiresIn: TOKEN_EXPIRY.VERIFICATION }
  );
  
  return token;
}

// Create a password reset token for a user
export function createPasswordResetToken(userId: number, email: string): string {
  // Create JWT token for password reset
  const token = jwt.sign(
    { 
      userId, 
      email, 
      purpose: 'password-reset'
    }, 
    JWT_SECRET, 
    { expiresIn: TOKEN_EXPIRY.PASSWORD_RESET }
  );
  
  return token;
}

// Verify a token (both verification and password reset)
export function verifyToken(token: string, purpose: 'email-verification' | 'password-reset'): any {
  try {
    // Verify and decode JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if token has the correct purpose
    if (decoded.purpose !== purpose) {
      console.error('Token purpose mismatch:', decoded.purpose, purpose);
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Send a custom notification email
export async function sendNotificationEmail(
  user: User,
  subject: string,
  message: string,
  buttonText?: string,
  buttonUrl?: string
): Promise<boolean> {
  try {
    // Generate HTML content
    let buttonHtml = '';
    if (buttonText && buttonUrl) {
      buttonHtml = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${buttonUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">${buttonText}</a>
        </div>
      `;
    }
    
    // Send email with Resend
    const { data, error } = await getResend().emails.send({
      from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
      to: user.email,
      subject: subject,
      html: EmailTemplates.generateNotificationEmailHTML(user, subject, message, buttonText, buttonUrl),
    });
    
    if (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
    
    console.log(`✅ Notification email sent to ${user.email}, ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}
