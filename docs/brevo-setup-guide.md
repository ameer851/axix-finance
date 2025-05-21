# Brevo SMTP Setup Guide

This guide will help you properly set up Brevo SMTP for sending emails from your CaraxFinance application.

## Issue

The current Brevo SMTP API key is not authenticating successfully when testing connections.

## Troubleshooting Steps

### 1. Verify Your Brevo Account

1. Log in to your Brevo account at https://app.brevo.com/
2. Ensure your account is active and not suspended

### 2. Generate a New SMTP API Key

1. In your Brevo dashboard, navigate to **SMTP & API** section
2. Click on the **SMTP** tab
3. Look for **SMTP Keys** section
4. Click **Generate a New SMTP Key**
5. Name your key (e.g., "CaraxFinance")
6. Copy the generated key which should look like: `xsmtpsib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-yyyyyyy`

### 3. Verify SMTP Credentials

The correct SMTP settings for Brevo are:
- **Host**: smtp-relay.brevo.com
- **Port**: 587
- **User**: Your Brevo account email (e.g., aliyuamir607@gmail.com)
- **Password**: The SMTP API key you generated (not your account password)
- **Secure**: false

### 4. Update Your Environment Variables

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=aliyuamir607@gmail.com
SMTP_PASSWORD=your_new_api_key_here
```

### 5. Check for IP Restrictions

Brevo might block connections from certain IPs:
1. Go to **SMTP & API** → **Security**
2. Make sure your server's IP address is not blocked
3. If you're developing locally, your IP might be dynamic - contact Brevo support if needed

### 6. Check Sending Limits

Brevo has sending limits based on your plan:
1. Go to **SMTP & API** → **Statistics**
2. Check if you've reached your daily/monthly limits

## Testing Your Configuration

After updating your credentials, test the connection with:

```bash
node scripts/test-brevo.js
```

## Alternative: Using Ethereal for Development

While troubleshooting Brevo, you can continue using Ethereal for development:

```bash
$env:NODE_ENV="development"; node scripts/email-test-simple.js
```

## Advanced Troubleshooting

If you continue to experience the "Invalid login: 535 5.7.8 Authentication failed" error after trying the steps above:

### 1. Check Your Account Status
- Log in to your Brevo account
- Check if there are any account notifications or warnings
- Ensure your account is active and in good standing

### 2. Try Alternative Authentication Methods
- Instead of using the SMTP User (email) and API Key, try:
  - Using the SMTP Login provided in the Brevo dashboard specifically for SMTP integration
  - Using v3 API Key instead of SMTP Key (if available)

### 3. Verify Email Sending Limits
- Check if you've reached your account email sending limits
- Free tier accounts have limited sending capabilities

### 4. Try Alternative SMTP Settings
```
SMTP_HOST=smtp-relay.sendinblue.com  # Try this alternative hostname
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=aliyuamir607@gmail.com
SMTP_PASSWORD=your_api_key
```

## Getting Help from Brevo Support

If you continue to experience issues:
1. Contact Brevo support at https://help.brevo.com/hc/en-us/requests/new
2. Provide them with:
   - The error message: "Invalid login: 535 5.7.8 Authentication failed"
   - Your account email address
   - When the issue started occurring
3. Ask them to verify your SMTP configuration and API key permissions
4. Request information about any account limitations or restrictions

## Next Steps

Once you have a working API key:
1. Update your `.env` file with the new key
2. Test sending a real email
3. Configure your production environment with the same settings