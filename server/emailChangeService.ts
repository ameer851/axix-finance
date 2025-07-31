import { Request, Response } from 'express';
import { generateEmailVerificationToken } from './auth';
import { DatabaseStorage } from './storage';
import { sendVerificationEmail } from './emailManager';
import { User } from '@shared/schema';

// Create a storage instance
const storage = new DatabaseStorage();

/**
 * Handle email change request
 * This is a separate flow from regular profile updates
 * It will:
 * 1. Save the new email as pendingEmail in the user record
 * 2. Generate a new verification token
 * 3. Send a verification email to the NEW email address
 * 4. Only update the actual email after verification
 */
export async function handleEmailChange(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { email: newEmail } = req.body;
    
    if (!newEmail) {
      return res.status(400).json({ message: 'New email is required' });
    }
    
    // Check if email is valid
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }
    
    // Check if email is already in use
    const existingUser = await storage.getUserByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: 'Email is already associated with another account' });
    }
    
    // Get current user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If the email is the same as the current one, just return success
    if (user.email === newEmail) {
      return res.status(200).json({ message: 'Email is already set to this address' });
    }
    
    // Generate verification token
    const token = generateEmailVerificationToken(userId, newEmail);
    
    // Update user with pendingEmail and new verification token
    // The actual email field will only be updated after verification
    const updatedUser = await storage.updateUser(userId, {
      pendingEmail: newEmail,
      verificationToken: token,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isVerified: false // Mark as unverified until the new email is confirmed
    });
    
    if (!updatedUser) {
      return res.status(500).json({ message: 'Failed to update user record' });
    }
    
    // Create a temporary user object with the new email for sending verification
    const tempUser: User = {
      ...user,
      email: newEmail // Use the new email for sending the verification
    };
    
    // Send verification email to the NEW email address
    await sendVerificationEmail(tempUser, token);
    
    return res.status(200).json({ 
      message: 'Verification email sent to your new email address. Please check your inbox and verify your new email.' 
    });
    
  } catch (error) {
    console.error('Email change error:', error);
    return res.status(500).json({ message: 'Failed to process email change request' });
  }
}

/**
 * Complete email change after verification
 * This function should be called when verifying the token
 * It will update the user's email field with the pending email
 */
export async function completeEmailChange(userId: number, pendingEmail: string): Promise<boolean> {
  try {
    // Update the user's email with the pending email
    const updatedUser = await storage.updateUser(userId, {
      email: pendingEmail,
      pendingEmail: null,
      verificationToken: null,
      verificationTokenExpiry: null,
      isVerified: true // Mark as verified
    });
    
    return !!updatedUser;
  } catch (error) {
    console.error('Error completing email change:', error);
    return false;
  }
}
