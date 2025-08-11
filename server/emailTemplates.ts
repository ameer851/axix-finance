// Email templates for AxixFinance
import { User as DrizzleUser } from "@shared/schema";

const BRAND_COLORS = {
  primary: "#4A2F1D", // Brand Brown
  secondary: "#2C1810", // Darker accent
  success: "#2C1810",
  warning: "#8C5A3C",
  danger: "#8B1E1E",
  background: "#4A2F1D", // Requested brown overall email background
  card: "#FFFFFF", // Card surface
  text: "#1A1A1A",
  lightText: "#6B4C33",
  border: "#E5DED7",
  accent: "#C28A55",
} as const;

const COMMON_STYLES = {
  outerWrapper: `background-color:${BRAND_COLORS.background}; padding:32px 0; font-family:Arial, sans-serif;`,
  container: `max-width:640px; margin:0 auto; background:${BRAND_COLORS.card}; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.12); border:1px solid ${BRAND_COLORS.border};`,
  header: `background: linear-gradient(90deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.secondary}); padding:28px 24px; text-align:left;`,
  headerText:
    "color:#ffffff; margin:0; font-size:26px; font-weight:600; letter-spacing:.5px;",
  body: `padding:28px 28px 8px 28px; color:${BRAND_COLORS.text}; line-height:1.55; font-size:15px;`,
  infoBox: `background-color:#F9F7F5; padding:16px 18px; border-radius:8px; margin:24px 0; border:1px solid ${BRAND_COLORS.border};`,
  button: `background-color:${BRAND_COLORS.primary}; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:14px; display:inline-block; letter-spacing:.3px;`,
  footer: `background:${BRAND_COLORS.card}; padding:28px 24px 32px 24px; text-align:center; font-size:12px; color:${BRAND_COLORS.lightText};`,
  link: `color:${BRAND_COLORS.primary}; text-decoration:none;`,
  heroImage: `max-width:480px; width:100%; height:auto; border-radius:12px; border:1px solid ${BRAND_COLORS.border}; box-shadow:0 2px 6px rgba(0,0,0,0.12);`,
  logoImg:
    "width:48px; height:48px; vertical-align:middle; margin-right:12px; border-radius:8px; border:2px solid rgba(255,255,255,0.4); background:#FFFFFF; object-fit:cover;",
} as const;

// Initialize all template functions
function generateDepositApprovalEmailHTML(
  user: DrizzleUser,
  amount: number,
  currency: string,
  planName?: string,
  baseUrl?: string
): string {
  return `
    <div style="${COMMON_STYLES.outerWrapper}">
      <div style="${COMMON_STYLES.container}">
        <div style="${COMMON_STYLES.header}">
          <h1 style="${COMMON_STYLES.headerText}">
            <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
                 alt="AxixFinance Icon" 
                 style="${COMMON_STYLES.logoImg}" />
            AxixFinance
          </h1>
        </div>
        <div style="${COMMON_STYLES.body}">
        <h2>Deposit Approved!</h2>
        <p>Hello ${user.firstName || user.username},</p>
        <p>Your deposit has been successfully approved and processed. Here are the details:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" 
               alt="AxixFinance" 
               style="${COMMON_STYLES.heroImage}" />
        </div>

        <div style="${COMMON_STYLES.infoBox}">
          <p style="margin: 0;"><strong>Amount:</strong> ${amount.toLocaleString()} ${currency}</p>
          ${planName ? `<p style="margin: 10px 0 0 0;"><strong>Investment Plan:</strong> ${planName}</p>` : ""}
          <p style="margin: 10px 0 0 0;"><strong>Status:</strong> <span style="color: ${BRAND_COLORS.success};">✅ Approved</span></p>
          <p style="margin: 10px 0 0 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Your funds have been successfully added to your account and are now ready for investment.</p>
        <p>Your dashboard has been updated with this transaction. To view your updated balance and investment details, please log in to your account.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${baseUrl || "https://axixfinance.com"}/dashboard" style="${COMMON_STYLES.button}">Go to Dashboard</a>
        </div>
        <p>Best regards,<br>The AxixFinance Team</p>
        </div>
        <div style="${COMMON_STYLES.footer}">
        <p>© ${new Date().getFullYear()} AxixFinance. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </div>
  `;
}

interface WelcomeEmailOptions {
  plainPassword?: string | null;
}

function generateWelcomeEmailHTML(
  user: DrizzleUser,
  opts?: WelcomeEmailOptions
): string {
  const plainPassword =
    opts?.plainPassword || (user as any).initialPassword || null;
  return `
    <div style="${COMMON_STYLES.outerWrapper}">
      <div style="${COMMON_STYLES.container}">
        <div style="${COMMON_STYLES.header}">
          <h1 style="${COMMON_STYLES.headerText}">
            <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
                 alt="AxixFinance Icon" 
                 style="${COMMON_STYLES.logoImg}" />
            AxixFinance
          </h1>
        </div>
        <div style="${COMMON_STYLES.body}">
        <h2>Welcome to AxixFinance!</h2>
        <p>Hello ${user.full_name || user.email},</p>
        <p>Thank you for joining AxixFinance. Your account is now ready to use.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" 
               alt="AxixFinance Welcome" 
               style="${COMMON_STYLES.heroImage}" />
        </div>

        <div style="${COMMON_STYLES.infoBox}">
          <h3 style="margin: 0 0 15px 0; color: ${BRAND_COLORS.primary};">Login Information</h3>
          <p style="margin: 0 0 10px 0;"><strong>Username:</strong> ${user.username || user.full_name || user.email}</p>
          <p style="margin: 0;"><strong>Email:</strong> ${user.email}</p>
          ${plainPassword ? `<p style="margin:10px 0 0 0;"><strong>Password:</strong> <span style="font-family:monospace; background:#FFF4EA; padding:2px 6px; border-radius:4px; border:1px solid ${BRAND_COLORS.border};">${plainPassword}</span></p>` : `<p style=\"margin:12px 0 0 0; font-size:12px; color:${BRAND_COLORS.lightText};\"><em>Password not included for security. Use the one you created during signup.</em></p>`}
          <p style="margin:14px 0 0 0; font-size:11px; color:${BRAND_COLORS.lightText}; line-height:1.4;">For security, change this password after first login and never share it. This email will not be shown again.</p>
        </div>
        <p style="margin-top:24px;">You now have full access to your investment dashboard. Fund your account, track performance, and manage withdrawals in one secure place.</p>
        <div style="text-align:center; margin:32px 0;">
          <a href="https://axixfinance.com/login" style="${COMMON_STYLES.button}">Access Your Dashboard</a>
        </div>
        <p><strong>Security Notice:</strong> For your security, please ensure you're accessing AxixFinance only through our official website.</p>
        <p>If you need any assistance, our support team is ready to help!</p>
        <p>Best regards,<br>The AxixFinance Team</p>
        </div>
        <div style="${COMMON_STYLES.footer}">
        <p>© ${new Date().getFullYear()} AxixFinance. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </div>
  `;
}

function generateDepositConfirmationEmailHTML(
  user: DrizzleUser,
  amount: number,
  currency: string,
  txHash: string,
  planName?: string
): string {
  return `
    <div style="${COMMON_STYLES.outerWrapper}">
      <div style="${COMMON_STYLES.container}">
        <div style="${COMMON_STYLES.header}">
          <h1 style="${COMMON_STYLES.headerText}">
            <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
                 alt="AxixFinance Icon" 
                 style="${COMMON_STYLES.logoImg}" />
            AxixFinance
          </h1>
        </div>
        <div style="${COMMON_STYLES.body}">
        <h2>Deposit Confirmation</h2>
        <p>Hello ${user.firstName || user.username},</p>
        <p>We're pleased to confirm that your deposit has been successfully processed:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" alt="AxixFinance" style="${COMMON_STYLES.heroImage}" />
        </div>

        <div style="${COMMON_STYLES.infoBox}">
          <p style="margin: 0;"><strong>Amount:</strong> ${amount.toLocaleString()} ${currency}</p>
          <p style="margin: 10px 0 0 0;"><strong>Transaction Hash:</strong> ${txHash}</p>
          ${planName ? `<p style="margin: 10px 0 0 0;"><strong>Investment Plan:</strong> ${planName}</p>` : ""}
          <p style="margin: 10px 0 0 0;"><strong>Status:</strong> <span style="color: ${BRAND_COLORS.success};">Confirmed</span></p>
        </div>
        <p>Your account has been credited with the deposited amount. You can track your investment performance by logging into your dashboard.</p>
        <div style="text-align: center; margin: 30px 0; padding: 12px 24px; background-color: ${BRAND_COLORS.background}; border-radius: 4px;">
          <strong>To view your investment details:</strong><br>
          Log in to your AxixFinance account and visit the Dashboard section
        </div>
        <p>Thank you for choosing AxixFinance for your investment journey.</p>
        <p>Best regards,<br>The AxixFinance Team</p>
        </div>
        <div style="${COMMON_STYLES.footer}">
        <p>© ${new Date().getFullYear()} AxixFinance. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
        <p>For security: Always verify email sender addresses and never share your account credentials.</p>
        </div>
      </div>
    </div>
  `;
}

function generateWithdrawalRequestEmailHTML(
  user: DrizzleUser,
  amount: number,
  currency: string,
  destination: string,
  ipAddress?: string
): string {
  return `
    <div style="${COMMON_STYLES.outerWrapper}">
      <div style="${COMMON_STYLES.container}">
        <div style="${COMMON_STYLES.header}">
          <h1 style="${COMMON_STYLES.headerText}">
            <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
                 alt="AxixFinance Icon" 
                 style="${COMMON_STYLES.logoImg}" />
            AxixFinance
          </h1>
        </div>
        <div style="${COMMON_STYLES.body}">
        <h2>Withdrawal Request Received</h2>
        <p>Hello ${user.firstName || user.username},</p>
        <p>We have received your withdrawal request with the following details:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" alt="AxixFinance" style="${COMMON_STYLES.heroImage}" />
        </div>

        <div style="${COMMON_STYLES.infoBox}">
          <p style="margin: 0;"><strong>Amount:</strong> ${amount.toLocaleString()} ${currency}</p>
          <p style="margin: 10px 0 0 0;"><strong>Destination:</strong> ${destination}</p>
          <p style="margin: 10px 0 0 0;"><strong>Status:</strong> <span style="color: ${BRAND_COLORS.warning};">Pending Review</span></p>
          ${ipAddress ? `<p style="margin: 10px 0 0 0;"><strong>Request IP:</strong> ${ipAddress}</p>` : ""}
        </div>
        <p>Our team will review your withdrawal request within the next 24 hours. You will receive another email once your withdrawal has been processed.</p>
        <div style="text-align: center; margin: 30px 0; padding: 12px 24px; background-color: ${BRAND_COLORS.background}; border-radius: 4px;">
          <strong>To track your withdrawal:</strong><br>
          Log in to your AxixFinance account and check the Withdrawals section
        </div>
        <p><strong>Security Notice:</strong> If you did not initiate this withdrawal request, please contact our support team immediately.</p>
        <p>Best regards,<br>The AxixFinance Team</p>
        </div>
        <div style="${COMMON_STYLES.footer}">
        <p>© ${new Date().getFullYear()} AxixFinance. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </div>
  `;
}

function generateWithdrawalConfirmationEmailHTML(
  user: DrizzleUser,
  amount: number,
  currency: string,
  destination: string,
  txHash?: string,
  baseUrl?: string
): string {
  return `
    <div style="${COMMON_STYLES.outerWrapper}">
      <div style="${COMMON_STYLES.container}">
        <div style="${COMMON_STYLES.header}">
          <h1 style="${COMMON_STYLES.headerText}">
            <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
                 alt="AxixFinance Icon" 
                 style="${COMMON_STYLES.logoImg}" />
            AxixFinance
          </h1>
        </div>
        <div style="${COMMON_STYLES.body}">
        <h2>Withdrawal Processed Successfully</h2>
        <p>Hello ${user.firstName || user.username},</p>
        <p>Your withdrawal request has been successfully processed:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" alt="AxixFinance" style="${COMMON_STYLES.heroImage}" />
        </div>

        <div style="${COMMON_STYLES.infoBox}">
          <p style="margin: 0;"><strong>Amount:</strong> ${amount.toLocaleString()} ${currency}</p>
          <p style="margin: 10px 0 0 0;"><strong>Destination:</strong> ${destination}</p>
          ${txHash ? `<p style="margin: 10px 0 0 0;"><strong>Transaction Hash:</strong> ${txHash}</p>` : ""}
          <p style="margin: 10px 0 0 0;"><strong>Status:</strong> <span style="color: ${BRAND_COLORS.success};">Completed</span></p>
        </div>
        <p>The funds have been sent to your specified destination. Please allow some time for the transaction to be confirmed on the network.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${baseUrl || "https://axixfinance.com"}/dashboard" style="${COMMON_STYLES.button}">Go to Dashboard</a>
        </div>
        <p>Thank you for using AxixFinance. We appreciate your trust in our services.</p>
        <p>Best regards,<br>The AxixFinance Team</p>
        </div>
        <div style="${COMMON_STYLES.footer}">
        <p>© ${new Date().getFullYear()} AxixFinance. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </div>
  `;
}

export {
  generateDepositApprovalEmailHTML,
  generateDepositConfirmationEmailHTML,
  // Placeholder generators (legacy references) to avoid runtime errors; real implementations can be added later.
  generateNotificationEmailHTML,
  generatePasswordResetEmailHTML,
  generateVerificationEmailHTML,
  generateWelcomeEmailHTML,
  generateWithdrawalConfirmationEmailHTML,
  generateWithdrawalRequestEmailHTML,
};

// --- Temporary placeholder implementations for legacy references ---
// These were exported but not defined, causing TS2304 errors. Provide simple wrappers.
function generateNotificationEmailHTML(
  user: any,
  title: string,
  message: string
) {
  return `<!DOCTYPE html><html><body><h2>${title}</h2><p>Hello ${user?.firstName || user?.username || user?.email || "User"},</p><p>${message}</p><p>— AxixFinance</p></body></html>`;
}

function generatePasswordResetEmailHTML(user: any, resetLink: string) {
  return `<!DOCTYPE html><html><body><h2>Password Reset Request</h2><p>Hello ${user?.firstName || user?.username || user?.email || "User"},</p><p>Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>If you did not request this, you can ignore this email.</p><p>— AxixFinance</p></body></html>`;
}

function generateVerificationEmailHTML(user: any, verifyLink: string) {
  return `<!DOCTYPE html><html><body><h2>Verify Your Email</h2><p>Hello ${user?.firstName || user?.username || user?.email || "User"},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyLink}">Verify Email</a></p><p>If you did not create an account, you can ignore this email.</p><p>— AxixFinance</p></body></html>`;
}
