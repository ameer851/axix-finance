// Email service manager to handle Resend email service (API with SMTP fallback)
import { User } from "@shared/schema";
import {
  isResendConfigured,
  sendPasswordResetEmail as sendResendPasswordResetEmail,
  sendVerificationEmail as sendResendVerificationEmail,
  sendWelcomeEmail as sendResendWelcomeEmail,
  validateEmailSetup,
} from "./resendEmailService";
import { DatabaseStorage } from "./storage";

// Create a storage instance
const storage = new DatabaseStorage();

// State to track which email service is active
let usingResend = false;

/**
 * Check if any email service is configured
 * @returns {boolean} Whether any email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return isResendConfigured();
}

/**
 * Initialize the email services
 * This function will try to initialize Resend API first, then Resend SMTP only
 */
export async function initializeEmailServices(): Promise<boolean> {
  console.log("📧 Initializing email services...");

  // Try Resend first if configured (either API or SMTP will work)
  if (isResendConfigured()) {
    usingResend = await validateEmailSetup();

    if (usingResend) {
      console.log(
        "📧 Using Resend as primary email service (API with SMTP fallback)"
      );
      return true;
    } else {
      console.log(
        "⚠️ Resend validation failed, check API key and configuration"
      );
    }
  } else {
    console.log(
      "❌ Resend not configured. Please configure Resend API or SMTP"
    );
  }

  console.error("❌ Failed to initialize email services");
  return false;
}

/**
 * Send verification email to a user
 */
export async function sendVerificationEmail(
  user: User,
  token?: string
): Promise<boolean> {
  try {
    if (usingResend) {
      if (token) {
        return await sendResendVerificationEmail(user, token);
      } else {
        // Generate a token if one wasn't provided
        const generatedToken = Math.random().toString(36).substring(2, 15);
        return await sendResendVerificationEmail(user, generatedToken);
      }
    } else {
      console.error("❌ Resend email service is not configured");
      return false;
    }
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return false;
  }
}

/**
 * Send welcome email to a user
 */
export async function sendWelcomeEmail(user: User): Promise<boolean> {
  try {
    if (usingResend) {
      return await sendResendWelcomeEmail(user);
    } else {
      console.error("❌ Resend email service is not configured");
      return false;
    }
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return false;
  }
}

/**
 * Send password reset email to a user
 */
export async function sendPasswordResetEmail(
  user: User,
  token: string
): Promise<boolean> {
  try {
    if (usingResend) {
      return await sendResendPasswordResetEmail(user, token);
    } else {
      console.error("❌ Resend email service is not configured");
      return false;
    }
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    return false;
  }
}

/**
 * Send deposit request email to a user
 */
export async function sendDepositRequestEmail(
  user: User,
  amount: string,
  method: string,
  planName?: string
): Promise<boolean> {
  try {
    if (usingResend) {
      // For now, we'll use a fallback approach since these specific templates might not be in resendEmailService
      // You can later add these to resendEmailService if needed
      const { sendDepositRequestEmail: sendDepositRequestEmailService } =
        await import("./emailService");
      return await sendDepositRequestEmailService(
        user,
        amount,
        method,
        planName
      );
    }

    console.warn(
      "⚠️ No email service available for deposit request notification"
    );
    return false;
  } catch (error) {
    console.error("❌ Error sending deposit request email:", error);
    return false;
  }
}

/**
 * Send deposit approved email to a user
 */
export async function sendDepositApprovedEmail(
  user: User,
  amount: string,
  method: string,
  planName?: string
): Promise<boolean> {
  try {
    if (usingResend) {
      const { sendDepositApprovedEmail: sendDepositApprovedEmailService } =
        await import("./emailService");
      return await sendDepositApprovedEmailService(
        user,
        amount,
        method,
        planName
      );
    }

    console.warn(
      "⚠️ No email service available for deposit approved notification"
    );
    return false;
  } catch (error) {
    console.error("❌ Error sending deposit approved email:", error);
    return false;
  }
}

/**
 * Send withdrawal request email to a user
 */
export async function sendWithdrawalRequestEmail(
  user: User,
  amount: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    if (usingResend) {
      const { sendWithdrawalRequestEmail: sendWithdrawalRequestEmailService } =
        await import("./emailService");
      return await sendWithdrawalRequestEmailService(user, amount, ipAddress);
    }

    console.warn(
      "⚠️ No email service available for withdrawal request notification"
    );
    return false;
  } catch (error) {
    console.error("❌ Error sending withdrawal request email:", error);
    return false;
  }
}est email:", error);
    return false;
  }
}

/**
 * Send withdrawal approved email to a user
 */
export async function sendWithdrawalApprovedEmail(
  user: User,
  amount: string,
  cryptoAccount: string
): Promise<boolean> {
  try {
    if (usingResend) {
      const {
        sendWithdrawalApprovedEmail: sendWithdrawalApprovedEmailService,
      } = await import("./emailService");
      return await sendWithdrawalApprovedEmailService(
        user,
        amount,
        cryptoAccount
      );
    }

    console.warn(
      "⚠️ No email service available for withdrawal approved notification"
    );
    return false;
  } catch (error) {
    console.error("❌ Error sending withdrawal approved email:", error);
    return false;
  }
}

/**
 * Check if any email service is available
 */
export function isEmailServiceAvailable(): boolean {
  return usingResend;
}

/**
 * Get the active email service name
 */
export function getActiveEmailService(): string {
  if (usingResend) return "Resend API with SMTP fallback";
  return "None (No email service available)";
}
