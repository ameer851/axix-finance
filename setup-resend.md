# Resend Email Setup Guide

This guide will help you configure Resend for sending emails in your Axix Finance application.

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Domain Verification**: Add and verify your domain in Resend dashboard
3. **API Key**: Generate an API key from your Resend dashboard

## Setup Steps

### 1. Get Your Resend API Key

1. Log in to your [Resend Dashboard](https://resend.com/dashboard)
2. Go to **API Keys** section
3. Click **Create API Key**
4. Give it a descriptive name (e.g., "Axix Finance Production")
5. Copy the generated API key (starts with `re_`)

### 2. Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Resend Email Configuration (Primary)
RESEND_API_KEY=your-resend-api-key-here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Axix Finance
```

### 3. Domain Configuration

#### For Production:
- Use your verified domain: `noreply@yourdomain.com`
- Make sure your domain is verified in Resend dashboard

#### For Development/Testing:
- You can use the Resend sandbox domain: `onboarding@resend.dev`
- No verification needed for testing

### 4. Example Configuration

```bash
# Production Example
RESEND_API_KEY=re_123456789abcdef
EMAIL_FROM=noreply@axixfinance.com
EMAIL_FROM_NAME=Axix Finance

# Development Example  
RESEND_API_KEY=re_123456789abcdef
EMAIL_FROM=onboarding@resend.dev
EMAIL_FROM_NAME=Axix Finance
```

## Verification

1. Start your server: `npm run dev`
2. Check the console for: `✅ Resend SMTP connection verified successfully!`
3. Test sending an email through your application

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**
   - Check that your API key is correct and starts with `re_`
   - Make sure there are no extra spaces in the environment variable

2. **"Domain not verified"**
   - Verify your domain in the Resend dashboard
   - Or use `onboarding@resend.dev` for testing

3. **"Connection timeout"**
   - Check your internet connection
   - Verify firewall settings allow SMTP connections on port 587

### Fallback Configuration

If Resend is not configured, the system will fall back to Gmail SMTP if configured:

```bash
# Gmail SMTP Configuration (Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

## Benefits of Using Resend

✅ **Better Deliverability**: Professional email service with high delivery rates
✅ **No Debug Bloat**: Clean logs without massive debug output
✅ **Easy Setup**: Simple API key configuration
✅ **Reliable**: Built for production use
✅ **Cost Effective**: Generous free tier and reasonable pricing

## Support

For Resend-specific issues, check:
- [Resend Documentation](https://resend.com/docs)
- [Resend Status Page](https://status.resend.com)

For application-specific issues, check your application logs and ensure all environment variables are properly set.
