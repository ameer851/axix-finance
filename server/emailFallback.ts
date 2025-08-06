import * as console from "console";
import { createTransport } from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId: string;
  message: string;
}

/**
 * Configure a development email transport that logs emails to console
 * This is a fallback when email services are unavailable
 */
export function setupDevEmailTransport() {
  // Create a transport that logs to console instead of sending emails
  const devTransport = {
    name: "dev-mode",
    version: "1.0.0",
    send: (mail: any, callback: any) => {
      const info = {
        messageId: "DEV_MODE_" + Math.random().toString(36).substring(2),
        envelope: mail.message.getEnvelope(),
      };
      console.log("================ EMAIL DEV MODE ================");
      console.log("To:", mail.data.to);
      console.log("From:", mail.data.from);
      console.log("Subject:", mail.data.subject);
      console.log(
        "Body:",
        mail.data.text || mail.data.html?.substring(0, 300) + "..."
      );
      console.log("=================================================");

      callback(null, info);
    },
  };

  return createTransport(devTransport);
}

/**
 * Simple console-based logging for development when email services are unavailable
 */
export function sendDevModeEmail(options: EmailOptions): EmailResult {
  console.log("================ EMAIL DEV MODE ================");
  console.log("To:", options.to);
  console.log("From:", process.env.EMAIL_FROM || "noreply@axixfinance.com");
  console.log("Subject:", options.subject);
  console.log("Body:", options.text || options.html?.substring(0, 300) + "...");
  console.log("=================================================");

  return {
    success: true,
    messageId: "DEV_MODE_" + Math.random().toString(36).substring(2),
    message: "Email logged to console in development mode",
  };
}
