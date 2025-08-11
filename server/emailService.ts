// Email service for sending emails using templates
import { User as DrizzleUser } from "@shared/schema";
import nodemailer from "nodemailer";
import { z } from "zod";
import { sendDevModeEmail, setupDevEmailTransport } from "./emailFallback";
import {
  generateDepositApprovalEmailHTML,
  generateDepositConfirmationEmailHTML,
  generateWelcomeEmailHTML,
  generateWithdrawalConfirmationEmailHTML,
  generateWithdrawalRequestEmailHTML,
} from "./emailTemplates";

// Create a reusable transporter with Nodemailer
let transporter: nodemailer.Transporter;

// Store Ethereal credentials for development testing
export let etherealAccount: { user: string; pass: string } | null = null;

// Flag to track if we're in dev mode fallback
let isDevMode = false;

// Utility: Get base URL for emails
function getBaseUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.PRODUCTION_URL ||
    "https://axixfinance.com"
  );
}

// Zod-based .env validation
const envSchema = z.object({
  RESEND_API_KEY: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email(),
  FRONTEND_URL: z.string().url().optional(),
  PRODUCTION_URL: z.string().url().optional(),
});

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
  console.error("❌ Invalid .env config:", envResult.error.format());
  process.exit(1);
}

// Validate config at module load (already done above)
/**
 * Get the configured 'from' email address
 * @returns {string} The email address to use in the 'from' field
 */
function getFromEmail(): string {
  return (
    process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@axixfinance.com"
  );
}

/**
 * Check if email service is properly configured
 * @returns {boolean} Whether email service is configured
 */
export function isConfigured(): boolean {
  return !!(
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD)
  );
}

// Initialize the email transporter
export async function initializeEmailTransporter(): Promise<boolean> {
  try {
    if (transporter) return true; // already initialized
    if (
      process.env.EMAIL_DEV_MODE === "true" ||
      process.env.NODE_ENV === "development"
    ) {
      console.log("📧 Using development mode email service (logs to console)");
      transporter = setupDevEmailTransport();
      isDevMode = true;
      return true;
    }
    if (process.env.RESEND_API_KEY) {
      console.log("[email] Setting up Resend SMTP transporter...");
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.resend.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: { user: "resend", pass: process.env.RESEND_API_KEY },
      });
      try {
        const verifyResult = await transporter.verify();
        console.log("[email] Resend transporter verify result:", verifyResult);
      } catch (vErr) {
        console.error("[email] Transporter verify failed", vErr);
      }
      isDevMode = false;
      return true;
    }
    // Fallback: create Ethereal test account automatically
    console.warn(
      "[email] No production credentials found. Creating Ethereal test account..."
    );
    const testAcct = await nodemailer.createTestAccount();
    etherealAccount = { user: testAcct.user, pass: testAcct.pass };
    transporter = nodemailer.createTransport({
      host: testAcct.smtp.host,
      port: testAcct.smtp.port,
      secure: testAcct.smtp.secure,
      auth: { user: testAcct.user, pass: testAcct.pass },
    });
    try {
      await transporter.verify();
      console.log(
        "[email] Ethereal transporter ready → messages will not deliver to real inbox, preview via URL."
      );
    } catch {}
    isDevMode = true; // treat as dev-ish
    return true;
  } catch (error) {
    console.error("Failed to initialize email transporter:", error);
    return false;
  }
}

// Email verification logic (patched for type safety and DrizzleUser mapping)
// This function sends a verification email to the user after registration or email change
export async function sendVerificationEmail(userRaw: any): Promise<boolean> {
  // Map userRaw to DrizzleUser, ensuring both username and email are present
  const user: DrizzleUser = {
    id: userRaw.id,
    email: userRaw.email,
    username: userRaw.username,
    // Add other required DrizzleUser fields if needed
    ...userRaw,
  };
  try {
    if (!transporter) await initializeEmailTransporter();
    if (isDevMode) {
      sendDevModeEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `<p>Hello ${user.username || user.email},</p><p>Please verify your email address for Axix Finance.</p>`,
        text: undefined,
      });
      return true;
    }
    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: "Verify your email address",
      html: `<p>Hello ${user.username || user.email},</p><p>Please verify your email address for Axix Finance.</p>`,
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    try {
      const storage = require("./storage");
      await storage.createLog({
        type: "error",
        message: `Verification email failed for user ${user.email}`,
        details: { error, userId: user.id },
      });
    } catch {}
    if (process.env.NODE_ENV === "development") {
      sendDevModeEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `<p>Hello ${user.username || user.email},</p><p>Please verify your email address for Axix Finance.</p>`,
        text: undefined,
      });
      return true;
    }
    return false;
  }
}

export async function sendWelcomeEmail(user: DrizzleUser): Promise<boolean> {
  try {
    if (!transporter) {
      console.log("[email] Initializing transporter for welcome email...");
      await initializeEmailTransporter();
    }
    if (
      isDevMode &&
      !etherealAccount &&
      process.env.EMAIL_DEV_MODE === "true"
    ) {
      console.log("[email] Dev mode welcome email ->", user.email);
      sendDevModeEmail({
        to: user.email,
        subject: "Welcome to Axix Finance",
        html: generateWelcomeEmailHTML(user),
        text: undefined,
      });
      return true;
    }
    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: "Welcome to Axix Finance",
      html: generateWelcomeEmailHTML(user),
    };
    console.log("[email] Sending welcome email via transporter", {
      to: user.email,
      from: mailOptions.from,
      transportType: etherealAccount
        ? "ethereal"
        : isDevMode
          ? "dev"
          : "resend-smtp",
    });
    const info = await transporter.sendMail(mailOptions);
    console.log("[email] Welcome email dispatched", {
      to: user.email,
      messageId: info.messageId,
      preview: (nodemailer as any).getTestMessageUrl?.(info) || null,
    });
    return true;
  } catch (error: any) {
    console.error("[email] Welcome email failure", {
      error: error?.message,
      stack: error?.stack,
      code: error?.code,
      response: error?.response,
    });
    try {
      const storage = require("./storage");
      await storage.createLog({
        type: "error",
        message: `Welcome email failed for user ${user.email}`,
        details: { error: error?.message, userId: user.id },
      });
    } catch {}
    if (etherealAccount) {
      console.log("[email] Ethereal fallback active; failure unexpected");
    }
    if (process.env.NODE_ENV === "development") {
      sendDevModeEmail({
        to: user.email,
        subject: "Welcome to Axix Finance (fallback)",
        html: generateWelcomeEmailHTML(user),
        text: undefined,
      });
      return true;
    }
    return false;
  }
}

export async function sendDepositRequestEmail(
  user: DrizzleUser,
  amount: string,
  method: string,
  planName?: string
): Promise<boolean> {
  try {
    if (!transporter) await initializeEmailTransporter();
    if (process.env.NODE_ENV !== "production") {
      console.log("[email] deposit request preparing", {
        user: user.email,
        amount,
        method,
        planName,
      });
    }
    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: "Axix Finance - Deposit Request Received",
      html: generateDepositConfirmationEmailHTML(
        user,
        parseFloat(amount),
        method,
        "",
        planName
      ),
    };
    const info = await transporter.sendMail(mailOptions);
    if (process.env.NODE_ENV !== "production") {
      console.log("[email] deposit request sent", {
        messageId: (info as any)?.messageId,
        to: user.email,
      });
    }
    return true;
  } catch (error) {
    console.warn("[email] deposit request failed", { error });
    try {
      const storage = require("./storage");
      await storage.createLog({
        type: "error",
        message: `Deposit request email failed for user ${user.email}`,
        details: { error, userId: user.id, amount, method, planName },
      });
    } catch {}
    return false;
  }
}

export async function sendDepositApprovedEmail(
  user: DrizzleUser,
  amount: string,
  method: string,
  planName?: string
): Promise<boolean> {
  let attempts = 0;
  let lastError: any = null;
  if (!transporter) await initializeEmailTransporter();
  const mailOptions = {
    from: getFromEmail(),
    to: user.email,
    subject: "Axix Finance - Deposit Approved & Confirmed",
    html: generateDepositApprovalEmailHTML(
      user,
      parseFloat(amount),
      method,
      planName,
      getBaseUrl()
    ),
  };
  while (attempts < 2) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      lastError = error;
      attempts++;
    }
  }
  try {
    const storage = require("./storage");
    await storage.createLog({
      type: "error",
      message: `Deposit approved email failed for user ${user.email}`,
      details: { error: lastError, userId: user.id, amount, method, planName },
    });
  } catch {}
  return false;
}

export async function sendWithdrawalRequestEmail(
  user: DrizzleUser,
  amount: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    if (!transporter) await initializeEmailTransporter();
    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: "Axix Finance - Withdrawal Request Received",
      html: generateWithdrawalRequestEmailHTML(
        user,
        parseFloat(amount),
        "USD",
        "Your crypto wallet",
        ipAddress
      ),
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    try {
      const storage = require("./storage");
      await storage.createLog({
        type: "error",
        message: `Withdrawal request email failed for user ${user.email}`,
        details: { error, userId: user.id, amount, ipAddress },
      });
    } catch {}
    return false;
  }
}

export async function sendWithdrawalApprovedEmail(
  user: DrizzleUser,
  amount: string,
  cryptoAccount: string
): Promise<boolean> {
  let attempts = 0;
  let lastError: any = null;
  if (!transporter) await initializeEmailTransporter();
  const mailOptions = {
    from: getFromEmail(),
    to: user.email,
    subject: "Axix Finance - Withdrawal Successfully Processed",
    html: generateWithdrawalConfirmationEmailHTML(
      user,
      parseFloat(amount),
      "USD",
      cryptoAccount,
      getBaseUrl()
    ),
  };
  while (attempts < 2) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      lastError = error;
      attempts++;
    }
  }
  try {
    const storage = require("./storage");
    await storage.createLog({
      type: "error",
      message: `Withdrawal approved email failed for user ${user.email}`,
      details: { error: lastError, userId: user.id, amount, cryptoAccount },
    });
  } catch {}
  return false;
}

export async function sendDepositSuccessEmail(
  user: DrizzleUser,
  amount: string,
  planName?: string
): Promise<boolean> {
  try {
    if (!transporter) await initializeEmailTransporter();
    const mailOptions = {
      from: getFromEmail(),
      to: user.email,
      subject: "Axix Finance - Deposit Confirmation",
      html: generateDepositConfirmationEmailHTML(
        user,
        parseFloat(amount),
        "USD",
        "pending-review",
        planName
      ),
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    try {
      const storage = require("./storage");
      await storage.createLog({
        type: "error",
        message: `Deposit success email failed for user ${user.email}`,
        details: { error, userId: user.id, amount, planName },
      });
    } catch {}
    return false;
  }
}
