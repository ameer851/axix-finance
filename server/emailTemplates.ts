// Email templates for AxixFinance
import { User as DrizzleUser } from "@shared/schema";

const BRAND_COLORS = {
  primary: "#4A2F1D", // Dark Brown
  secondary: "#2C1810", // Darker Brown
  success: "#2C1810", // Dark Brown for success
  warning: "#4A2F1D", // Dark Brown for warning
  danger: "#000000", // Black for danger
  background: "#FFFFFF", // White
  text: "#000000", // Black
  lightText: "#4A2F1D", // Dark Brown for lighter text
} as const;

const COMMON_STYLES = {
  container:
    "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;",
  header: `background-color: ${BRAND_COLORS.primary}; padding: 20px; text-align: center;`,
  headerText: "color: #ffffff; margin: 0;",
  body: `padding: 20px; border: 1px solid #e5e7eb; border-top: none; color: ${BRAND_COLORS.text};`,
  infoBox: `background-color: ${BRAND_COLORS.background}; padding: 15px; border-radius: 4px; margin: 20px 0;`,
  button: `background-color: ${BRAND_COLORS.primary}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;`,
  footer: `background-color: ${BRAND_COLORS.background}; padding: 20px; text-align: center; font-size: 12px; color: ${BRAND_COLORS.lightText};`,
  link: `color: ${BRAND_COLORS.primary}; text-decoration: none;`,
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
    <div style="${COMMON_STYLES.container}">
      <div style="${COMMON_STYLES.header}">
        <h1 style="${COMMON_STYLES.headerText}">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
               alt="AxixFinance Icon" 
               style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;" />
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
               style="max-width: 300px; width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />
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
  `;
}

function generateWelcomeEmailHTML(user: DrizzleUser): string {
  return `
    <div style="${COMMON_STYLES.container}">
      <div style="${COMMON_STYLES.header}">
        <h1 style="${COMMON_STYLES.headerText}">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
               alt="AxixFinance Icon" 
               style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;" />
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
               style="max-width: 300px; width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />
        </div>

        <div style="${COMMON_STYLES.infoBox}">
          <h3 style="margin: 0 0 15px 0; color: ${BRAND_COLORS.primary};">Login Information</h3>
          <p style="margin: 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 10px 0 0 0; color: ${BRAND_COLORS.primary};">
            <strong>Note:</strong> You can sign in using your Supabase auth credentials.
          </p>
        </div>

        <p>Here's what you can do next:</p>
        <div style="${COMMON_STYLES.infoBox}">
          <ul style="margin: 0; padding-left: 20px;">
            <li>Change your password</li>
            <li>Complete your profile information</li>
            <li>Set up two-factor authentication for extra security</li>
            <li>Explore our financial dashboard</li>
            <li>Make your first deposit</li>
          </ul>
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
    <div style="${COMMON_STYLES.container}">
      <div style="${COMMON_STYLES.header}">
        <h1 style="${COMMON_STYLES.headerText}">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
               alt="AxixFinance Icon" 
               style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;" />
          AxixFinance
        </h1>
      </div>
      <div style="${COMMON_STYLES.body}">
        <h2>Deposit Confirmation</h2>
        <p>Hello ${user.firstName || user.username},</p>
        <p>We're pleased to confirm that your deposit has been successfully processed:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" 
               alt="AxixFinance" 
               style="max-width: 300px; width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />
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
    <div style="${COMMON_STYLES.container}">
      <div style="${COMMON_STYLES.header}">
        <h1 style="${COMMON_STYLES.headerText}">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
               alt="AxixFinance Icon" 
               style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;" />
          AxixFinance
        </h1>
      </div>
      <div style="${COMMON_STYLES.body}">
        <h2>Withdrawal Request Received</h2>
        <p>Hello ${user.firstName || user.username},</p>
        <p>We have received your withdrawal request with the following details:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" 
               alt="AxixFinance" 
               style="max-width: 300px; width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />
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
    <div style="${COMMON_STYLES.container}">
      <div style="${COMMON_STYLES.header}">
        <h1 style="${COMMON_STYLES.headerText}">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
               alt="AxixFinance Icon" 
               style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;" />
          AxixFinance
        </h1>
      </div>
      <div style="${COMMON_STYLES.body}">
        <h2>Withdrawal Processed Successfully</h2>
        <p>Hello ${user.firstName || user.username},</p>
        <p>Your withdrawal request has been successfully processed:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" 
               alt="AxixFinance" 
               style="max-width: 300px; width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />
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
  `;
}

export {
  generateDepositApprovalEmailHTML,
  generateDepositConfirmationEmailHTML,
  generateWelcomeEmailHTML,
  generateWithdrawalConfirmationEmailHTML,
  generateWithdrawalRequestEmailHTML,
};
