// Email diagnostic tool
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get directory name (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console formatting helpers
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Success, fail and info formatters
const success = (msg) => `${GREEN}✓ ${msg}${RESET}`;
const fail = (msg) => `${RED}✗ ${msg}${RESET}`;
const info = (msg) => `${BLUE}ℹ ${msg}${RESET}`;
const warn = (msg) => `${YELLOW}⚠ ${msg}${RESET}`;
const header = (msg) => `${BOLD}${msg}${RESET}`;

async function generateRecommendations(issues) {
  const recommendations = [];

  if (issues.length === 0) {
    recommendations.push("✓ No issues detected! Your email configuration looks good.");
    return recommendations;
  }

  if (issues.includes("BREVO_AUTH_FAILED")) {
    recommendations.push(`${YELLOW}⚠ BREVO AUTHENTICATION ISSUE:${RESET}`);
    recommendations.push("  - Go to your Brevo account dashboard at https://app.brevo.com/");
    recommendations.push("  - Navigate to SMTP & API section");
    recommendations.push("  - Generate a new SMTP API key");
    recommendations.push("  - Update your .env file with the new key");
  }

  if (issues.includes("MISSING_ENV_VARS")) {
    recommendations.push(`${YELLOW}⚠ MISSING ENVIRONMENT VARIABLES:${RESET}`);
    recommendations.push("  - Check your .env file and ensure all required variables are set");
    recommendations.push("  - Required variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD");
    recommendations.push("  - For development: ETHEREAL_USER, ETHEREAL_PASS");
  }

  if (issues.includes("ETHEREAL_AUTH_FAILED")) {
    recommendations.push(`${YELLOW}⚠ ETHEREAL AUTHENTICATION ISSUE:${RESET}`);
    recommendations.push("  - Generate new Ethereal credentials at https://ethereal.email/create");
    recommendations.push("  - Update your .env file with the new credentials");
    recommendations.push("  - Alternatively, let the system create a new account for you automatically");
  }

  return recommendations;
}

async function testBrevoSMTP() {
  const issues = [];

  console.log(header("\n=== TESTING BREVO SMTP CONFIGURATION ==="));
  
  // Check required environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(fail(`Missing required environment variables: ${missingVars.join(', ')}`));
    issues.push("MISSING_ENV_VARS");
    return { success: false, issues };
  }
  
  // Log the configuration being used
  console.log(info(`Host: ${process.env.SMTP_HOST}`));
  console.log(info(`Port: ${process.env.SMTP_PORT}`));
  console.log(info(`User: ${process.env.SMTP_USER}`));
  console.log(info(`Password: ${process.env.SMTP_PASSWORD ? '********' + process.env.SMTP_PASSWORD.substr(-4) : 'Not set'}`));
  
  try {
    console.log(info("Creating Brevo SMTP transporter..."));
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      debug: true
    });
    
    console.log(info("Verifying SMTP connection..."));
    await transporter.verify();
    console.log(success("Brevo SMTP connection verified!"));
    
    return { success: true, issues };
  } catch (error) {
    console.log(fail(`Brevo SMTP connection failed: ${error.message}`));
    issues.push("BREVO_AUTH_FAILED");
    return { success: false, issues, error };
  }
}

async function testEtherealSMTP() {
  const issues = [];

  console.log(header("\n=== TESTING ETHEREAL SMTP CONFIGURATION ==="));
  
  try {
    // Try using existing Ethereal credentials if available
    if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
      console.log(info("Using existing Ethereal credentials from .env file..."));
      console.log(info(`User: ${process.env.ETHEREAL_USER}`));
      console.log(info(`Password: ${process.env.ETHEREAL_PASS ? '********' : 'Not set'}`));
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASS
        }
      });
      
      console.log(info("Verifying Ethereal SMTP connection..."));
      await transporter.verify();
      console.log(success("Ethereal SMTP connection verified!"));
      console.log(info("You can view Ethereal emails at: https://ethereal.email/login"));
      
      return { success: true, issues };
    } else {
      // Create a new Ethereal test account
      console.log(info("No Ethereal credentials found. Creating a new account..."));
      const testAccount = await nodemailer.createTestAccount();
      
      console.log(success("Ethereal test account created successfully!"));
      console.log(info(`Username: ${testAccount.user}`));
      console.log(info(`Password: ${testAccount.pass}`));
      console.log(info("Web Interface: https://ethereal.email/login"));
      
      // Suggest adding these to .env
      console.log(warn("\nConsider adding these credentials to your .env file:"));
      console.log(`ETHEREAL_USER=${testAccount.user}`);
      console.log(`ETHEREAL_PASS=${testAccount.pass}`);
      
      return { success: true, issues };
    }
  } catch (error) {
    console.log(fail(`Ethereal SMTP connection failed: ${error.message}`));
    issues.push("ETHEREAL_AUTH_FAILED");
    return { success: false, issues, error };
  }
}

async function runDiagnostic() {
  console.log(header("\n======= EMAIL CONFIGURATION DIAGNOSTIC ======="));
  console.log(info("Running diagnostics on your email configuration..."));
  console.log(info(`Environment: ${process.env.NODE_ENV || 'Not set (defaulting to development)'}`));
  
  // Test Brevo configuration 
  const brevoResult = await testBrevoSMTP();
  
  // Test Ethereal configuration
  const etherealResult = await testEtherealSMTP();
  
  // Generate a summary report
  console.log(header("\n======= EMAIL DIAGNOSTIC SUMMARY ======="));
  console.log(`Production email (Brevo): ${brevoResult.success ? success("CONFIGURED") : fail("NOT CONFIGURED")}`);
  console.log(`Development email (Ethereal): ${etherealResult.success ? success("CONFIGURED") : fail("NOT CONFIGURED")}`);
  
  // Combine issues from both tests
  const allIssues = [...(brevoResult.issues || []), ...(etherealResult.issues || [])];
  
  // Generate recommendations based on issues
  console.log(header("\n======= RECOMMENDATIONS ======="));
  const recommendations = await generateRecommendations(allIssues);
  recommendations.forEach(rec => console.log(rec));
  
  // Output current working configuration
  console.log(header("\n======= WORKING CONFIGURATION ======="));
  if (brevoResult.success) {
    console.log(success("✓ Production emails will be sent using Brevo"));
  } else if (etherealResult.success) {
    console.log(warn("⚠ Production environment will fall back to Ethereal (not recommended)"));
    console.log(info("  Fix your Brevo configuration for production use"));
  }
  
  if (etherealResult.success) {
    console.log(success("✓ Development emails will be captured by Ethereal"));
    console.log(info("  View test emails at: https://ethereal.email/login"));
  }
  
  // Final result
  console.log(header("\n======= CONCLUSION ======="));
  if (brevoResult.success && etherealResult.success) {
    console.log(success("Your email service is fully configured and ready for use!"));
  } else if (etherealResult.success) {
    console.log(warn("Your email service is partially configured (development only)"));
    console.log(info("You can continue development, but fix Brevo before deploying to production"));
  } else {
    console.log(fail("Your email service is not properly configured"));
    console.log(info("Follow the recommendations above to fix the issues"));
  }
}

// Run the diagnostic
runDiagnostic().catch(console.error);