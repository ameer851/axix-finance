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
  const pwSection = plainPassword
    ? `<p style=\"font-size:13px;color:#555\">Temporary password: <strong>${plainPassword}</strong></p>`
    : "";
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;line-height:1.5;border:1px solid #eee;border-radius:8px">
    <h1 style="font-size:20px;margin:0 0 16px;color:#111">Welcome to AxixFinance 👋</h1>
    <p style="margin:0 0 12px">Hi ${safeFirst} ${safeLast},</p>
    <p style="margin:0 0 12px">Your account has been created successfully.</p>
    ${pwSection}
    <p style="margin:16px 0 12px">You can now log in and explore your dashboard.</p>
    <p style="margin:24px 0 8px;font-size:12px;color:#888">If you did not create this account, please ignore this email.</p>
    <p style="margin:0;font-size:12px;color:#aaa">© ${new Date().getFullYear()} AxixFinance</p>
  </div>`;
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
