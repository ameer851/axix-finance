import { Resend } from "resend";

// Lightweight email utility for serverless deployment (full server excluded by .vercelignore)
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "AxixFinance";

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  try {
    resend = new Resend(RESEND_API_KEY);
  } catch (e) {
    console.error("[email] Failed to init Resend client", e);
  }
}

export function emailHealth() {
  return {
    apiKeyPresent: !!RESEND_API_KEY,
    clientReady: !!resend,
    fromEmail: FROM_EMAIL,
  };
}

function buildFrom(): string {
  return `${FROM_NAME} <${FROM_EMAIL}>`;
}

export async function sendWelcomeEmail(params: {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  plainPassword?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) return { success: false, error: "Email service not configured" };
  const { email, username, firstName, lastName, plainPassword } = params;
  const safeFirst = firstName || username || "User";
  const safeLast = lastName || "";
  const safeUsername = username || safeFirst || "User";
  const safePassword = plainPassword || "";
  const loginUrl =
    process.env.PUBLIC_LOGIN_URL || "https://axixfinance.com/login";
  const html = `
    <div style="background-color:#4A2F1D; padding:32px 0; font-family:Arial, sans-serif;">
      <div style="max-width:640px; margin:0 auto; background:#FFFFFF; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.12); border:1px solid #E5DED7;">
        <div style="background: linear-gradient(90deg, #4A2F1D, #2C1810); padding:28px 24px; text-align:left;">
          <h1 style="color:#ffffff; margin:0; font-size:26px; font-weight:600; letter-spacing:.5px;">
            <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png" 
                 alt="AxixFinance Icon" 
                 style="width:48px; height:48px; vertical-align:middle; margin-right:12px; border-radius:8px; border:2px solid rgba(255,255,255,0.4); background:#FFFFFF; object-fit:cover;" />
            AxixFinance
          </h1>
        </div>
        <div style="padding:28px 28px 8px 28px; color:#1A1A1A; line-height:1.55; font-size:15px;">
        <h2>Welcome to AxixFinance!</h2>
        <p>Hello ${safeFirst} ${safeLast},</p>
        <p>Thank you for joining AxixFinance. Your account is now ready to use.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png" 
               alt="AxixFinance Welcome" 
               style="max-width:480px; width:100%; height:auto; border-radius:12px; border:1px solid #E5DED7; box-shadow:0 2px 6px rgba(0,0,0,0.12);" />
        </div>

        <div style="background-color:#F9F7F5; padding:16px 18px; border-radius:8px; margin:24px 0; border:1px solid #E5DED7;">
          <h3 style="margin: 0 0 15px 0; color: #4A2F1D;">Login Information</h3>
          <p style="margin: 0 0 10px 0;"><strong>Username:</strong> ${safeUsername}</p>
          <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
          ${safePassword ? `<p style="margin:10px 0 0 0;"><strong>Password:</strong> <span style="font-family:monospace; background:#FFF4EA; padding:2px 6px; border-radius:4px; border:1px solid #E5DED7;">${safePassword}</span></p>` : ""}
          <p style="margin:14px 0 0 0; font-size:11px; color:#6B4C33; line-height:1.4;">For security, change this password after first login and never share it. This email will not be shown again.</p>
        </div>
        <p style="margin-top:24px;">You now have full access to your investment dashboard. Fund your account, track performance, and manage withdrawals in one secure place.</p>
        <div style="text-align:center; margin:32px 0;">
          <a href="${loginUrl}" style="background-color:#4A2F1D; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:14px; display:inline-block; letter-spacing:.3px;">Access Your Dashboard</a>
        </div>
        <p><strong>Security Notice:</strong> For your security, please ensure you're accessing AxixFinance only through our official website.</p>
        <p>If you need any assistance, our support team is ready to help!</p>
        <p>Best regards,<br>The AxixFinance Team</p>
        </div>
        <div style="background:#FFFFFF; padding:28px 24px 32px 24px; text-align:center; font-size:12px; color:#6B4C33;">
        <p>© ${new Date().getFullYear()} AxixFinance. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </div>
  `;
  try {
    const resp = await resend.emails.send({
      from: buildFrom(),
      to: email,
      subject: "Welcome to AxixFinance!",
      html,
    });
    if ((resp as any)?.error) {
      console.error("[email] Resend API error", (resp as any).error);
      return {
        success: false,
        error: (resp as any).error?.message || "Send failed",
      };
    }
    return { success: true };
  } catch (e: any) {
    console.error("[email] sendWelcomeEmail exception", e);
    return { success: false, error: e?.message || "Exception" };
  }
}
