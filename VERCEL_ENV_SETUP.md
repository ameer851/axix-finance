# Vercel Environment Variables Setup Guide

## SECURITY WARNING: 
**DO NOT PUT ACTUAL SECRETS IN THIS FILE - THESE ARE PLACEHOLDERS**

## Required Environment Variables for Vercel:

### Database Configuration
DATABASE_URL=[YOUR_SUPABASE_DATABASE_URL_FROM_DASHBOARD]

### Supabase Configuration  
SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY_FROM_DASHBOARD]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY_FROM_DASHBOARD]

### Frontend Vite Variables (IMPORTANT - These are needed for your React app)
VITE_SUPABASE_URL=[SAME_AS_SUPABASE_URL_ABOVE]
VITE_SUPABASE_ANON_KEY=[SAME_AS_SUPABASE_ANON_KEY_ABOVE]
VITE_FRONTEND_URL=https://axix-finance.vercel.app
VITE_API_URL=https://axix-finance.vercel.app

### Authentication & Security
SESSION_SECRET=[GENERATE_SECURE_RANDOM_STRING_64_CHARS]
JWT_SECRET=[GENERATE_SECURE_JWT_SECRET_64_CHARS]

### Email Configuration (Optional - for email features)
RESEND_API_KEY=[YOUR_RESEND_API_KEY_IF_USING_EMAIL]
EMAIL_FROM=[YOUR_FROM_EMAIL_ADDRESS]
EMAIL_FROM_NAME=AxixFinance

### Application URLs
CLIENT_URL=https://axix-finance.vercel.app
SITE_URL=https://axix-finance.vercel.app
FRONTEND_URL=https://axix-finance.vercel.app
CONTACT_EMAIL=support@axix-finance.com

## HOW TO GET THE ACTUAL VALUES:

### For Supabase Values:
1. Go to your Supabase project dashboard
2. Go to Settings > API
3. Copy the Project URL for SUPABASE_URL
4. Copy the anon/public key for SUPABASE_ANON_KEY
5. Copy the service_role key for SUPABASE_SERVICE_ROLE_KEY
6. Go to Settings > Database and copy the connection string for DATABASE_URL

### For Random Secrets:
Generate secure random strings using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## VERCEL SETUP STEPS:

1. **Add one variable at a time** - Don't try to add all at once
2. **Select environments**: Check "Production", "Preview", and "Development" 
3. **No quotes needed**: Don't wrap values in quotes in Vercel UI
4. **Special characters**: If a value has special characters, just paste it directly
5. **Save after each**: Click "Save" after adding each variable
6. **Redeploy**: After adding variables, trigger a new deployment

## ADDING CUSTOM DOMAIN TO VERCEL:

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Domains" in the sidebar
4. Enter your custom domain (e.g., axixfinance.com)
5. Follow Vercel's DNS configuration instructions
6. Update your domain's DNS records as shown by Vercel
7. Wait for DNS propagation (can take up to 48 hours)
