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
    // Since we're using Supabase directly, we need to call the server API for email sending
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/send-welcome-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          username: user.username,
          firstName: user.first_name || "User",
          lastName: user.last_name || "Name",
        }),
        credentials: "include",
      }
    );

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
    const response = await fetch("/api/admin/test-email", {
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
