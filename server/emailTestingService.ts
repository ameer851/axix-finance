import { User } from "@shared/schema";
import { Request, Response } from "express";
import {
  getActiveEmailService,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./emailManager";
import { DatabaseStorage } from "./storage";

// Create a storage instance
const storage = new DatabaseStorage();

/**
 * Send a test email from the admin panel
 * This endpoint allows admins to test different email templates
 */
export async function sendTestEmail(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin privileges required" });
    }

    const { type, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    if (!type) {
      return res.status(400).json({ message: "Email type is required" });
    }

    // Create a test user
    const testUser = {
      id: 0,
      username: "testuser",
      password: "",
      email: email,
      firstName: "Test",
      lastName: "User",
      balance: "0",
      role: "user" as const,
      isVerified: false,
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
      pendingEmail: null,
      bitcoinAddress: null,
      bitcoinCashAddress: null,
      ethereumAddress: null,
      bnbAddress: null,
      usdtTrc20Address: null,
    } as User;

    // Test token for verification emails
    const testToken = "TEST-TOKEN-FOR-ADMIN-PANEL-12345";

    // Log which service we're using
    const activeEmailService = getActiveEmailService();
    console.log(`📧 Testing email using ${activeEmailService} service`);

    let result = false;

    // Send the appropriate test email based on type
    switch (type) {
      case "verification":
        result = await sendVerificationEmail(testUser, testToken);
        break;

      case "welcome":
        result = await sendWelcomeEmail(testUser);
        break;

      case "password-reset":
        // For password reset test, set the token on the user object
        testUser.passwordResetToken = testToken;
        testUser.passwordResetTokenExpiry = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        );

        result = await sendPasswordResetEmail(testUser, testToken);
        break;

      default:
        return res.status(400).json({ message: "Invalid email type" });
    }

    if (result) {
      // Create log of the test email
      await storage.createLog({
        type: "info",
        userId: req.user.id,
        message: `Test ${type} email sent to ${email}`,
        details: { emailType: type },
      });

      return res.status(200).json({
        success: true,
        message: `Test ${type} email sent to ${email} successfully`,
      });
    } else {
      throw new Error("Failed to send test email");
    }
  } catch (error: any) {
    console.error("Error sending test email:", error);

    // Create error log
    if (req.user) {
      await storage.createLog({
        type: "error",
        userId: req.user.id,
        message: `Error sending test email: ${error.message || "Unknown error"}`,
        details: { error: error.toString() },
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send test email",
    });
  }
}
