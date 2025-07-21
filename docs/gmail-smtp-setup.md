# Gmail SMTP Setup Guide - Simple & Easy

## Why Gmail SMTP?
- ✅ More reliable than Brevo
- ✅ Easy to set up
- ✅ Works immediately
- ✅ Free for small volumes
- ✅ No complex API keys

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication on Gmail
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on **"Security"**
3. Enable **"2-Step Verification"** if not already enabled

### 2. Generate Gmail App Password
1. Still in Google Account Security settings
2. Look for **"App passwords"** (you need 2FA enabled first)
3. Click **"Generate"**
4. Select **"Mail"** as the app
5. Select **"Other"** as the device and name it "Axix Finance"
6. Copy the 16-character password (like: `abcd efgh ijkl mnop`)

### 3. Update Your .env File
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASSWORD=your-16-character-app-password
EMAIL_FROM=support@axix-finance.com
```

### 4. Test Your Setup
```bash
node scripts/test-gmail-smtp.js
```

## Important Notes
- Use your **Gmail address** as SMTP_USER
- Use the **App Password** (not your regular Gmail password)
- Keep 2-Factor Authentication enabled
- The EMAIL_FROM can be different from SMTP_USER (for branding)

## Advantages
- **Immediate setup** - no waiting for approval
- **High deliverability** - Gmail has excellent reputation
- **Simple troubleshooting** - fewer moving parts
- **Reliable service** - backed by Google infrastructure

## Sending Limits
- Gmail allows up to **500 emails per day** for free accounts
- This is usually sufficient for user notifications, password resets, etc.
- If you need more, consider upgrading to Google Workspace

## Troubleshooting
If you get authentication errors:
1. Double-check your App Password (no spaces)
2. Make sure 2FA is enabled on your Google account
3. Verify your Gmail address is correct
4. Try generating a new App Password
