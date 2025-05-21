# CaraxFinance Email Service Documentation

This document provides comprehensive information on the email service configuration and usage for the CaraxFinance application.

## Current Status (as of May 20, 2025)

| Environment | Provider | Status | Notes |
|-------------|----------|--------|-------|
| Development | Ethereal | ✅ Working | Emails can be viewed at ethereal.email |
| Production | Brevo | ❌ Authentication Issue | Need to resolve API key permissions |

## Overview

The CaraxFinance email service is designed to:

1. Send verification emails to new users
2. Send password reset emails for account recovery
3. Send notification emails for various events (transactions, security alerts, etc.)
4. Send marketing emails (for subscribed users only)

## Email Providers

The application supports two email providers:

### 1. Development Environment: Ethereal

[Ethereal](https://ethereal.email) is a fake SMTP service that captures emails sent during development without actually delivering them. This allows for testing email functionality without sending real emails.

#### Configuration:

```javascript
{
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ETHEREAL_EMAIL,
    pass: process.env.ETHEREAL_PASSWORD
  }
}
```

#### Testing:

Emails sent through Ethereal can be viewed at https://ethereal.email using the credentials provided when setting up the account.

### 2. Production Environment: Brevo (formerly SendinBlue)

[Brevo](https://www.brevo.com/) is a commercial email service used for production environments.

#### Configuration:

```javascript
{
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_API_KEY
  }
}
```

## Environment Variables

The following environment variables need to be configured:

### Development
- `ETHEREAL_EMAIL` - Ethereal account email
- `ETHEREAL_PASSWORD` - Ethereal account password
- `EMAIL_FROM` - Sender email address (e.g., "support@caraxfinance.com")

### Production
- `BREVO_EMAIL` - Brevo account email
- `BREVO_API_KEY` - Brevo API key
- `EMAIL_FROM` - Sender email address (e.g., "support@caraxfinance.com")

## Email Templates

Email templates are stored in the `server/emailTemplates` directory and include:

- `verification.html` - For account email verification
- `resetPassword.html` - For password reset requests
- `notification.html` - For general notifications
- `welcome.html` - Welcome email for new users

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
