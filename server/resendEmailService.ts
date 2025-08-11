// Email service using Resend for sending verification emails and other notifications
import { User } from "@shared/schema";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import * as EmailTemplates from "./emailTemplates";
import { DatabaseStorage } from "./storage";

// Create a storage instance
const storage = new DatabaseStorage();

// Set token expiration times
const TOKEN_EXPIRY = {
  VERIFICATION: 86400, // 24 hours in seconds
  PASSWORD_RESET: 3600, // 1 hour in seconds
};

// JWT secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || "carax-verification-secret";

// Initialize the Resend API client with API key if available
const resendApiKey = process.env.RESEND_API_KEY;
// Optional flag to disable SMTP fallback entirely (force API usage)
const DISABLE_SMTP_FALLBACK =
  process.env.RESEND_DISABLE_SMTP_FALLBACK === "true";
let resend: Resend | null = null;
// Initialize Resend SMTP transporter (optional fallback)
let resendSmtpTransporter: nodemailer.Transporter | null = null;

try {
  if (resendApiKey) {
    resend = new Resend(resendApiKey);
    console.log("📧 Resend client initialized with API key");

    if (DISABLE_SMTP_FALLBACK) {
      console.log(
        "🚫 RESEND_DISABLE_SMTP_FALLBACK=true set; SMTP fallback will NOT be initialized"
      );
    } else {
      // Initialize Resend SMTP transporter
      resendSmtpTransporter = nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 587, // Using STARTTLS
        secure: false,
        auth: {
          user: "resend", // Resend SMTP username is always 'resend'
          pass: resendApiKey, // Using the same API key
        },
      });
      console.log("📧 Resend SMTP transporter initialized");
    }
  }
} catch (error) {
  console.error("❌ Error initializing Resend client:", error);
}

// Default from address for emails
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || "AxixFinance";

/**
 * Helper function to safely call Resend API
 * @returns The Resend instance or throws an error if not initialized
 */
function getResend(): Resend {
  if (!resend) {
    throw new Error("Resend client not initialized");
  }
  return resend;
}

/**
 * Check if Resend is properly configured
 * @returns {boolean} Whether Resend is configured
 */
export function isResendConfigured(): boolean {
  if (!resendApiKey) return false;
  // When fallback disabled, only API client counts
  if (DISABLE_SMTP_FALLBACK) return !!resend;
  return !!resend || !!resendSmtpTransporter;
}

/**
 * Check if Resend SMTP is configured
 * @returns {boolean} Whether Resend SMTP is configured
 */
export function isResendSmtpConfigured(): boolean {
  if (DISABLE_SMTP_FALLBACK) return false;
  return !!resendApiKey && !!resendSmtpTransporter;
}

/**
 * Get low-level Resend health info (domains visibility + basic flags)
 */
export async function getResendHealth() {
  const health: any = {
    apiKeyPresent: !!resendApiKey,
    apiClient: !!resend,
    smtpConfigured: isResendSmtpConfigured(),
    smtpFallbackDisabled: DISABLE_SMTP_FALLBACK,
  };
  if (resend) {
    try {
      const domainsResp = await resend.domains.list();
      health.domainsRawKeys = Object.keys(domainsResp || {});
      const list = (domainsResp as any)?.data || [];
      health.domainCount = list.length;
      if (list.length) health.firstDomain = list[0];
    } catch (err: any) {
      health.domainError = err?.message || String(err);
    }
  } else if (!resendApiKey) {
    health.note = "RESEND_API_KEY missing";
  } else {
    health.note = "Resend client not initialized";
  }
  return health;
}

// Validate that Resend API key is available
export async function validateEmailSetup(): Promise<boolean> {
  if (!isResendConfigured()) {
    console.error(
      "❌ Resend API key is not configured or client initialization failed."
    );
    return false;
  }

  // Try API first (required when fallback disabled)
  if (resend) {
    try {
      // Test that we can use the Resend API
      const domains = await resend.domains.list();

      if (domains && domains.data) {
        console.log("✅ Resend API connection verified successfully!");
        console.log(`📧 Resend API connected successfully`);
        return true;
      } else {
        console.error(
          "❌ Could not verify Resend API connection, will try SMTP fallback"
        );
      }
    } catch (error) {
      console.error("❌ Failed to connect to Resend API:", error);
      if (!DISABLE_SMTP_FALLBACK)
        console.log("🔄 Trying Resend SMTP fallback...");
    }
  }

  // If fallback disabled, stop here so failure is visible
  if (DISABLE_SMTP_FALLBACK) {
    if (!resend) {
      console.error(
        "❌ Resend API client not initialized and SMTP fallback disabled"
      );
    }
    return !!resend; // true only if API initialized
  }

  // Try SMTP fallback if API fails and not disabled
  if (resendSmtpTransporter) {
    try {
      // Test the SMTP connection
      const smtpVerified = await resendSmtpTransporter.verify();
      if (smtpVerified) {
        console.log("✅ Resend SMTP connection verified successfully!");
        console.log(`📧 Using Resend SMTP as fallback`);
        return true;
      } else {
        console.error("❌ Could not verify Resend SMTP connection");
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to connect to Resend SMTP:", error);
      return false;
    }
  } else {
    console.error("❌ Resend SMTP transporter is not initialized");
    return false;
  }

  return false;
}

// Run validation on startup
validateEmailSetup().catch((err) => {
  console.error("Email setup validation error:", err);
});

// Send email using Resend SMTP
async function sendEmailViaResendSMTP(
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    if (!resendSmtpTransporter) {
      console.error("❌ Resend SMTP transporter is not initialized");
      return false;
    }

    const mailOptions = {
      from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };
    // Verbose logging before SMTP send
    console.log(
      "🔶 [EmailService] 🔄 Resend SMTP send start. Payload:",
      mailOptions
    );

    const info = await resendSmtpTransporter.sendMail(mailOptions);
    // Verbose logging after SMTP send
    console.log("🔷 [EmailService] 📋 Resend SMTP raw response:", info);
    console.log(
      "✅ [EmailService] 📧 Email sent via Resend SMTP. MessageId:",
      info.messageId
    );

    return true;
  } catch (error) {
    // Detailed exception logging for SMTP
    console.error(
      "🔴 [EmailService] 💥 Exception during Resend SMTP send:",
      (error as Error).stack
    );
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
    const baseUrl = process.env.BASE_URL || "http://localhost:4000";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    // Generate email HTML content using templates
    const htmlContent = EmailTemplates.generateVerificationEmailHTML(
      user,
      verificationUrl
    );

    let success = false;
    let emailId: string | undefined;

    // Try sending with Resend API first
    if (resend) {
      const payload = {
        from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
        to: user.email,
        subject: "Verify Your Email Address",
        html: htmlContent,
      };
      console.log(
        "🔶 [EmailService] 🔄 Resend API send start. Payload:",
        payload
      );
      try {
        const response = await resend.emails.send(payload);
        console.log("🔷 [EmailService] 📋 Resend API raw response:", response);
        if (response.error) {
          console.error(
            "🔴 [EmailService] ❌ Resend API returned error:",
            response.error
          );
        }
        if (response.data?.id) {
          console.log(
            `✅ Verification email sent to ${user.email} via Resend API, ID: ${response.data.id}`
          );
          emailId = response.data.id;
          success = true;
        } else {
          console.log("🔄 Trying Resend SMTP fallback...");
        }
      } catch (apiError) {
        console.error(
          "🔴 [EmailService] 💥 Exception during Resend API send:",
          (apiError as Error).stack
        );
        console.log("🔄 Trying Resend SMTP fallback...");
      }
    }

    // If API fails, try SMTP
    if (!success && !DISABLE_SMTP_FALLBACK) {
      success = await sendEmailViaResendSMTP(
        user.email,
        "Verify Your Email Address",
        htmlContent
      );

      if (success) {
        console.log(
          `✅ Verification email sent to ${user.email} via Resend SMTP`
        );
      }
    }

    // Log the verification email for audit purposes if either method succeeded
    if (success) {
      await storage
        .createLog({
          type: "info",
          message: `Verification email sent to ${user.email}`,
          userId: user.id,
          details: {
            emailId: emailId,
            token: process.env.NODE_ENV === "production" ? undefined : token,
            verificationUrl:
              process.env.NODE_ENV === "production"
                ? undefined
                : verificationUrl,
          },
        })
        .catch((err) =>
          console.error("Failed to log verification email:", err)
        );
    }

    return success;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}

// Send a welcome email after verification
export async function sendWelcomeEmail(user: User): Promise<boolean> {
  try {
    // Generate email HTML content using templates (include plain password if present on transient field)
    const htmlContent = EmailTemplates.generateWelcomeEmailHTML(user as any, {
      plainPassword:
        (user as any).plainPassword || (user as any).initialPassword || null,
    });

    let success = false;

    // Try sending with Resend API first
    if (resend) {
      const payload = {
        from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
        to: user.email,
        subject: "Welcome to AxixFinance!",
        html: htmlContent,
      };
      console.log(
        "🔶 [EmailService] 🔄 Resend API send start. Payload:",
        payload
      );
      try {
        const response = await resend.emails.send(payload);
        console.log("🔷 [EmailService] 📋 Resend API raw response:", response);
        if (response.error) {
          console.error(
            "🔴 [EmailService] ❌ Resend API returned error:",
            response.error
          );
          console.log("🔄 Trying Resend SMTP fallback...");
        } else if (response.data?.id) {
          console.log(
            `✅ Welcome email sent to ${user.email} via Resend API, ID: ${response.data.id}`
          );
          success = true;
        }
      } catch (apiError) {
        console.error(
          "🔴 [EmailService] 💥 Exception during Resend API send:",
          (apiError as Error).stack
        );
        console.log("🔄 Trying Resend SMTP fallback...");
      }
    } // end if(resend)

    // If API fails, try SMTP
    if (!success && !DISABLE_SMTP_FALLBACK) {
      success = await sendEmailViaResendSMTP(
        user.email,
        "Welcome to AxixFinance!",
        htmlContent
      );

      if (success) {
        console.log(`✅ Welcome email sent to ${user.email} via Resend SMTP`);
      }
    }

    return success;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
}

// Send a password reset email
export async function sendPasswordResetEmail(
  user: User,
  token: string
): Promise<boolean> {
  try {
    // Generate reset URL
    const baseUrl = process.env.BASE_URL || "http://localhost:4000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Generate email HTML content using templates
    const htmlContent = EmailTemplates.generatePasswordResetEmailHTML(
      user,
      resetUrl
    );

    let success = false;
    let emailId: string | undefined;

    // Try sending with Resend API first
    if (resend) {
      const payload = {
        from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
        to: user.email,
        subject: "Reset Your Password",
        html: htmlContent,
      };
      console.log(
        "🔶 [EmailService] 🔄 Resend API send start. Payload:",
        payload
      );
      try {
        const response = await resend.emails.send(payload);
        console.log("🔷 [EmailService] 📋 Resend API raw response:", response);
        if (response.error) {
          console.error(
            "🔴 [EmailService] ❌ Resend API returned error:",
            response.error
          );
          console.log("🔄 Trying Resend SMTP fallback...");
        } else if (response.data?.id) {
          console.log(
            `✅ Password reset email sent to ${user.email} via Resend API, ID: ${response.data.id}`
          );
          emailId = response.data.id;
          success = true;
        }
      } catch (apiError) {
        console.error(
          "🔴 [EmailService] 💥 Exception during Resend API send:",
          (apiError as Error).stack
        );
        console.log("🔄 Trying Resend SMTP fallback...");
      }
    } // end if(resend)

    // If API fails, try SMTP
    if (!success && !DISABLE_SMTP_FALLBACK) {
      success = await sendEmailViaResendSMTP(
        user.email,
        "Reset Your Password",
        htmlContent
      );

      if (success) {
        console.log(
          `✅ Password reset email sent to ${user.email} via Resend SMTP`
        );
      }
    }

    // Log the password reset email for audit purposes if either method succeeded
    if (success) {
      await storage
        .createLog({
          type: "info",
          message: `Password reset email sent to ${user.email}`,
          userId: user.id,
          details: {
            emailId: emailId,
            token: process.env.NODE_ENV === "production" ? undefined : token,
            resetUrl:
              process.env.NODE_ENV === "production" ? undefined : resetUrl,
          },
        })
        .catch((err) =>
          console.error("Failed to log password reset email:", err)
        );
    }

    return success;
  } catch (error) {
    console.error("Error sending password reset email:", error);
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
      subject: "Deposit Confirmation",
      html: EmailTemplates.generateDepositConfirmationEmailHTML(
        user,
        amount,
        currency,
        txHash
      ),
    });

    if (error) {
      console.error("Failed to send deposit confirmation email:", error);
      return false;
    }

    console.log(
      `✅ Deposit confirmation email sent to ${user.email}, ID: ${data?.id}`
    );
    return true;
  } catch (error) {
    console.error("Error sending deposit confirmation email:", error);
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
      purpose: "email-verification",
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY.VERIFICATION }
  );

  return token;
}

// Create a password reset token for a user
export function createPasswordResetToken(
  userId: number,
  email: string
): string {
  // Create JWT token for password reset
  const token = jwt.sign(
    {
      userId,
      email,
      purpose: "password-reset",
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY.PASSWORD_RESET }
  );

  return token;
}

// Verify a token (both verification and password reset)
export function verifyToken(
  token: string,
  purpose: "email-verification" | "password-reset"
): any {
  try {
    // Verify and decode JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if token has the correct purpose
    if (decoded.purpose !== purpose) {
      console.error("Token purpose mismatch:", decoded.purpose, purpose);
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
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
    let buttonHtml = "";
    if (buttonText && buttonUrl) {
      buttonHtml = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${buttonUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">${buttonText}</a>
        </div>
      `;
    }

    // Send email with Resend
    const payload = {
      from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
      to: user.email,
      subject: subject,
      html: EmailTemplates.generateNotificationEmailHTML(
        user,
        subject,
        message
      ),
    };
    console.log(
      "🔶 [EmailService] 🔄 Resend API send start. Payload:",
      payload
    );
    try {
      const response = await getResend().emails.send(payload);
      console.log("🔷 [EmailService] 📋 Resend API raw response:", response);
      if (response.error) {
        console.error(
          "🔴 [EmailService] ❌ Resend API returned error:",
          response.error
        );
        return false;
      }
      console.log(
        `✅ Notification email sent to ${user.email}, ID: ${response.data?.id}`
      );
      return true;
    } catch (apiError) {
      console.error(
        "🔴 [EmailService] 💥 Exception during Resend API send:",
        (apiError as Error).stack
      );
      return false;
    }
  } catch (error) {
    console.error("Error sending notification email:", error);
    return false;
  }
}
