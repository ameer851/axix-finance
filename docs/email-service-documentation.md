# Axix Finance Email Service Documentation

This document provides comprehensive information on the email service configuration and usage for the Axix Finance application.

## Current Status (as of January 2025)

| Environment | Provider | Status | Notes |
|-------------|----------|--------|-------|
| Production | Gmail SMTP | ✅ Working | Using Gmail App Password for authentication |
| Development | Ethereal (fallback) | ⚠️ Disabled | Only used when Gmail SMTP is not available |

## Overview

The Axix Finance email service is designed to:

1. Send verification emails to new users
2. Send password reset emails for account recovery
3. Send notification emails for various events (transactions, security alerts, etc.)
4. Send welcome emails and other user communications

## Email Provider: Gmail SMTP

[Gmail SMTP](https://support.google.com/a/answer/176600) is used for production email delivery, providing:
- ✅ High deliverability rates
- ✅ Reliable service backed by Google
- ✅ Simple setup with App Passwords
- ✅ No complex API configurations needed

### Gmail SMTP Configuration

```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,     // Your Gmail address
    pass: process.env.SMTP_PASSWORD  // Gmail App Password
  }
}
```

### Setup Requirements
1. **Gmail Account** with 2-Factor Authentication enabled
2. **App Password** generated from Google Account settings
3. **Environment Variables** configured in `.env` file

## Environment Variables

The following environment variables are configured for production:

```bash
# Production Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=aliyuamir607@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=support@axix-finance.com
```

## Email Templates

Email templates are stored in the `server/emailTemplates` directory and include:

- `verification.html` - For account email verification
- `resetPassword.html` - For password reset requests
- `welcome.html` - Welcome email for new users
- `notification.html` - For general notifications

## Sending Limits

Gmail SMTP allows:
- **500 emails per day** for personal Gmail accounts
- **2000 emails per day** for Google Workspace accounts
- Sufficient for user notifications and account management

## Troubleshooting

### Common Issues
1. **Authentication Failed**: Verify App Password is correct and 2FA is enabled
2. **Connection Timeout**: Check firewall settings and network connectivity
3. **Rate Limiting**: Ensure you're within Gmail's sending limits

### Testing Email Service
Use the diagnostic script to test your configuration:
```bash
node scripts/email-diagnostic.js
```

## Usage Examples

### Sending a Verification Email

```javascript
import { sendVerificationEmail } from './emailService';

await sendVerificationEmail({
  to: user.email,
  username: user.username,
  verificationToken: token
});
```

### Sending a Password Reset Email

```javascript
import { sendPasswordResetEmail } from './emailService';

await sendPasswordResetEmail({
  to: user.email,
  username: user.username,
  resetToken: token
});
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify API keys and credentials in environment variables
   - Check if the API key has the necessary permissions

2. **Email Not Received**
   - Check spam/junk folder
   - Verify the recipient email is correct
   - For development, check Ethereal inbox

3. **Rate Limiting**
   - Brevo has sending limits based on your plan
   - Implement queueing for bulk emails

## Diagnostics

Use the following script to test email functionality:

```bash
# For development environment
npm run email:diagnose

# For production environment
npm run email:diagnose:prod
```

## Future Improvements

1. Implement email queueing for bulk emails
2. Add HTML email templates with better design
3. Set up email analytics tracking
4. Implement email preference center for users
