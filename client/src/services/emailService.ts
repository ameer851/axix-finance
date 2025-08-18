import config from "../config";
/**
 * Request an email change and initiate verification process
 * @param newEmail The new email address to use
 */
export async function updateEmail(
  newEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/update-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: newEmail }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update email");
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || "Verification email sent to your new address",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update email",
    };
  }
}

/**
 * Send welcome email to a new user
 * @param user The user object containing email and other details
 */
export async function sendWelcomeEmail(user: {
  email: string;
  full_name: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Prefer same-origin relative path to satisfy production CSP; fall back to explicit base if provided
  const base = config.apiUrl.replace(/\/$/, "");
  const relative = base.startsWith("/");
  const url = `${relative ? "" : base}/api/send-welcome-email`;
    // Lightweight client-side debug (won't leak secrets)
    if (typeof window !== "undefined") {
      (window as any)._welcomeEmailDebug = { url, ts: Date.now() };
    }
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        username:
          (user as any).username || user.full_name?.split(" ")[0] || "User",
        firstName:
          (user as any).first_name || user.full_name?.split(" ")[0] || "User",
        lastName:
          (user as any).last_name || user.full_name?.split(" ")[1] || "Name",
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to send welcome email" }));
      throw new Error(errorData.message || "Failed to send welcome email");
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || "Welcome email sent successfully",
    };
  } catch (error: any) {
    console.error("Welcome email error:", error);
    return {
      success: false,
      message: error.message || "Failed to send welcome email",
    };
  }
}

/**
 * Test the email service from admin panel
 * @param emailType The type of email to test
 * @param recipientEmail The email address to send the test to
 */
export async function sendTestEmail(
  emailType: string,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
  const base2 = config.apiUrl.replace(/\/$/, "");
  const rel2 = base2.startsWith("/");
  const testUrl = `${rel2 ? "" : base2}/api/admin/test-email`;
  const response = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: emailType,
        email: recipientEmail,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send test email");
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || "Test email sent successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to send test email",
    };
  }
}
