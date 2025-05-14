// Email service for sending verification emails and other notifications
import { User } from "@shared/schema";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { DatabaseStorage } from "./storage";

// Create a storage instance
const storage = new DatabaseStorage();
import jwt from "jsonwebtoken";

// Set token expiration times
const TOKEN_EXPIRY = {
  VERIFICATION: '24h',  // 24 hours for email verification
  PASSWORD_RESET: '1h'  // 1 hour for password reset
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
    // In production, use configured SMTP settings
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
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
    } else {
      // For development/testing, use Ethereal (creates a new test account each time)
      const testAccount = await nodemailer.createTestAccount();
      etherealAccount = {
        user: testAccount.user,
        pass: testAccount.pass
      };
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        },
        debug: true,
        logger: true
      });
      
      console.log('\n===== ETHEREAL EMAIL TEST ACCOUNT =====');
      console.log('📧 Username:', testAccount.user);
      console.log('🔑 Password:', testAccount.pass);
      console.log('🌐 Web Interface: https://ethereal.email/login');
      console.log('Note: Use these credentials to login and view test emails');
      console.log('=======================================\n');
    }
    
    // Verify the transporter configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('SMTP transporter verification failed:', error);
      } else {
        console.log('SMTP transporter ready to send messages');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    throw error;
  }
}

// Get the transporter, creating it if needed
async function getEmailTransporter(): Promise<nodemailer.Transporter> {
  if (!transporter) {
    return initializeEmailTransporter();
  }
  return transporter;
}

/**
 * Generate a secure verification token using JWT
 * @param userId The user ID to include in the token
 * @param type The token type ('verification' or 'password-reset')
 * @returns A signed JWT token with expiration
 */
export function generateSecureToken(userId: number, type: 'verification' | 'password-reset'): string {
  const payload = {
    userId,
    type,
    timestamp: Date.now()
  };
  
  const expiresIn = type === 'verification' ? TOKEN_EXPIRY.VERIFICATION : TOKEN_EXPIRY.PASSWORD_RESET;
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode a token
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export function verifyToken(token: string): { userId: number; type: string; timestamp: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as { userId: number; type: string; timestamp: number };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Generate a verification token for a user
 * @returns A string token for email verification
 */
export function generateVerificationToken(): string {
  // For backward compatibility, keep this method but make it more secure
  return randomBytes(48).toString('hex');
}

/**
 * Send a verification email to a user
 * @param user The user to send the verification email to
 * @param token The verification token
 * @returns A promise that resolves when the email is sent
 */
export async function sendVerificationEmail(user: User, token: string): Promise<void> {
  try {
    // Enhanced validation to prevent "No recipients defined" error
    if (!user) {
      console.error("Cannot send verification email: User object is undefined");
      return Promise.reject(new Error("Invalid user object"));
    }
    
    if (!user.email || typeof user.email !== 'string') {
      console.error("Cannot send verification email: Email address is missing for user", user.id);
      return Promise.reject(new Error("Email address is missing"));
    }

    // Additional validation for email format
    const email = user.email.trim();
    if (!email.includes('@') || !email.includes('.')) {
      console.error("Cannot send verification email: Invalid email format", email);
      return Promise.reject(new Error("Invalid email format"));
    }

    // Log the recipient for debugging
    console.log(`Preparing to send verification email to: ${email}`);
    
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    
    const message = {
      from: process.env.EMAIL_FROM || '"Carax Finance" <noreply@caraxfinance.com>',
      to: email, // Make sure the email is properly formatted and exists
      subject: "Verify Your Carax Finance Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Carax Finance!</h2>
          <p>Thank you for creating an account. Please verify your email address to continue.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify My Email</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #777; font-size: 12px;">Carax Finance - Secure Financial Services</p>
        </div>
      `
    };
    
    console.log(`Sending verification email to ${email} with token: ${token.substring(0, 10)}...`);
    const emailTransporter = await getEmailTransporter();
    
    const info = await emailTransporter.sendMail(message);

    // Enhanced handling for Ethereal test emails in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n===== VERIFICATION EMAIL SENT SUCCESSFULLY =====');
      console.log('📧 Message ID:', info.messageId);
      
      // Always try to get the preview URL from Ethereal
      const previewUrl = nodemailer.getTestMessageUrl(info);
      
      if (previewUrl) {
        console.log('🔗 PREVIEW URL:', previewUrl);
        console.log('👆 Use the Ethereal credentials to view this email at the URL above');
      }
      
      // Also log the verification URL and token for easy testing
      console.log('\n✅ VERIFICATION INFO (FOR DEVELOPMENT TESTING):');
      console.log('Token:', token);
      console.log('Verification URL:', verificationUrl);
      console.log('\n💡 TIP: You can also use the development endpoint to manually verify users:');
      console.log(`GET /dev/verify-user/${email}`);
      console.log('=================================================\n');
    }
    
    // Create activity log for email sent
    await storage.createLog({
      type: 'info',
      userId: user.id,
      message: 'Verification email sent',
      details: { emailId: info.messageId }
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to send verification email:', error);
    console.error('Error details:', error.message);
    
    // Create activity log for failed email
    if (user && user.id) {
      await storage.createLog({
        type: 'error',
        userId: user.id,
        message: 'Failed to send verification email',
        details: { error: error.message }
      }).catch(e => console.error('Failed to log email error:', e));
    }
    
    return Promise.reject(error);
  }
}

/**
 * Resend a verification email to a user
 * @param user The user to resend the verification email to
 * @returns A promise that resolves when the email is sent
 */
export async function resendVerificationEmail(user: User): Promise<void> {
  // Generate a new token
  const token = generateVerificationToken();
  
  // Update the user's verification token
  await storage.updateUserVerificationToken(user.id, token);
  
  // Send the verification email
  return sendVerificationEmail(user, token);
}

/**
 * Send a password reset email to a user
 * @param user The user to send the password reset email to
 * @param token The reset token
 * @returns A promise that resolves when the email is sent
 */
export async function sendPasswordResetEmail(user: User, token: string): Promise<void> {
  // Enhanced validation to prevent "No recipients defined" error
  if (!user) {
    console.error("Cannot send password reset email: User object is undefined");
    return Promise.reject(new Error("Invalid user object"));
  }
  
  if (!user.email || typeof user.email !== 'string') {
    console.error("Cannot send password reset email: Email address is missing for user", user.id);
    return Promise.reject(new Error("Email address is missing"));
  }

  // Additional validation for email format
  const email = user.email.trim();
  if (!email.includes('@') || !email.includes('.')) {
    console.error("Cannot send password reset email: Invalid email format", email);
    return Promise.reject(new Error("Invalid email format"));
  }

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const message = {
    from: process.env.EMAIL_FROM || '"Carax Finance" <noreply@caraxfinance.com>',
    to: email,
    subject: "Reset Your Carax Finance Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password. Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset My Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">Carax Finance - Secure Financial Services</p>
      </div>
    `
  };
  
  try {
    console.log(`Sending password reset email to ${email}`);
    const emailTransporter = await getEmailTransporter();
    await emailTransporter.sendMail(message);
    return Promise.resolve();
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
    }
    return Promise.reject(error);
  }
}

/**
 * Send a notification email to a user
 * @param user The user to send the notification to
 * @param subject The subject of the notification
 * @param message The message content
 * @returns A promise that resolves when the email is sent
 */
export async function sendNotificationEmail(
  user: User, 
  subject: string, 
  message: string
): Promise<void> {
  // Enhanced validation to prevent "No recipients defined" error
  if (!user) {
    console.error("Cannot send notification email: User object is undefined");
    return Promise.reject(new Error("Invalid user object"));
  }
  
  if (!user.email || typeof user.email !== 'string') {
    console.error("Cannot send notification email: Email address is missing for user", user.id);
    return Promise.reject(new Error("Email address is missing"));
  }

  // Additional validation for email format
  const email = user.email.trim();
  if (!email.includes('@') || !email.includes('.')) {
    console.error("Cannot send notification email: Invalid email format", email);
    return Promise.reject(new Error("Invalid email format"));
  }

  const emailMessage = {
    from: process.env.EMAIL_FROM || '"Carax Finance" <noreply@caraxfinance.com>',
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${subject}</h2>
        <div style="margin: 20px 0;">
          ${message}
        </div>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">Carax Finance - Secure Financial Services</p>
      </div>
    `
  };
  
  try {
    console.log(`Sending notification email to ${email}: ${subject}`);
    const emailTransporter = await getEmailTransporter();
    await emailTransporter.sendMail(emailMessage);
    return Promise.resolve();
  } catch (error) {
    console.error("Failed to send notification email:", error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
    }
    return Promise.reject(error);
  }
}

/**
 * Send a notification to all admin users about a new user registration
 * @param newUser The newly registered user
 * @param userLocation The location information of the user (IP, country, etc.)
 * @returns A promise that resolves when all admin emails are sent
 */
export async function notifyAdminsOfNewUser(
  newUser: User,
  userLocation: { ip?: string; country?: string; city?: string; }
): Promise<void> {
  try {
    // Get all admin users
    const admins = await storage.getAdminUsers();
    
    if (!admins || admins.length === 0) {
      console.log("No admin users found to notify about new registration");
      return;
    }
    
    const locationInfo = [
      userLocation.ip ? `IP: ${userLocation.ip}` : null,
      userLocation.country ? `Country: ${userLocation.country}` : null,
      userLocation.city ? `City: ${userLocation.city}` : null
    ].filter(Boolean).join(', ');
    
    // Create email content for admins
    const subject = "New User Registration Alert";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New User Registration</h2>
        <p>A new user has registered on Carax Finance.</p>
        
        <h3 style="margin-top: 20px;">User Details:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Username:</strong> ${newUser.username}</li>
          <li><strong>Email:</strong> ${newUser.email}</li>
          <li><strong>Full Name:</strong> ${newUser.firstName} ${newUser.lastName}</li>
          <li><strong>Registration Time:</strong> ${new Date().toLocaleString()}</li>
          ${locationInfo ? `<li><strong>Location:</strong> ${locationInfo}</li>` : ''}
        </ul>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/users" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View User in Admin Panel
          </a>
        </div>
        
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #777; font-size: 12px;">Carax Finance - Secure Financial Services</p>
      </div>
    `;
    
    // Send notification to each admin
    const emailTransporter = await getEmailTransporter();
    for (const admin of admins) {
      const message = {
        from: process.env.EMAIL_FROM || "noreply@caraxfinance.com",
        to: admin.email,
        subject,
        html: htmlContent
      };
      
      await emailTransporter.sendMail(message);
    }
    
    console.log(`Admin notifications sent about new user: ${newUser.username}`);
  } catch (error) {
    console.error("Failed to send admin notifications:", error);
  }
}

/**
 * Verify a user's email using their verification token
 * @param token The verification token
 * @returns A promise that resolves to the verified user or null if token is invalid
 */
export async function verifyUserEmail(token: string): Promise<User | null> {
  try {
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.type !== 'verification') {
      console.error('Invalid verification token');
      return null;
    }
    
    // Get user with the verification token
    const user = await storage.getUserByVerificationToken(token);
    
    if (!user) {
      console.error('User not found or token already used');
      return null;
    }
    
    // Check token expiry
    if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
      console.error('Verification token expired');
      return null;
    }
    
    // Mark user as verified
    const updatedUser = await storage.updateUserVerificationStatus(user.id, true);
    
    // Clear verification token
    await storage.updateUserVerificationToken(user.id, ""); // Use empty string instead of null
    
    return updatedUser || null; // Ensure we return null if updatedUser is undefined
  } catch (error) {
    console.error("Error verifying user email:", error);
    return null;
  }
}