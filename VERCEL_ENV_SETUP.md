# Vercel Environment Variables Setup Guide

## Required Environment Variables for Vercel:

### Database Configuration
DATABASE_URL=postgresql://postgres.wvnyiinrmfysabsfztii:0nPJxjEsfpHLQNcb@aws-0-us-east-2.pooler.supabase.com:6543/postgres

### Supabase Configuration  
SUPABASE_URL=https://wvnyiinrmfysabsfztii.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDM2NywiZXhwIjoyMDY4NjcwMzY3fQ.zLhFm0aPCDfbUQHWWdPJeRfXaI06JP1sHzfGdHM0n9g

### Frontend Vite Variables (IMPORTANT - These are needed for your React app)
VITE_SUPABASE_URL=https://wvnyiinrmfysabsfztii.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k
VITE_FRONTEND_URL=https://axix-finance-mtgf.vercel.app

### Authentication & Security
SESSION_SECRET=Ug+U2K1TNcEwDtKgb7rkser/X6KTiEtc7s3Mr+J4RET7LUiUQFUmC2YdjRRXkbXCSLjqFm2THvRwKlBpfNrmLA==
JWT_SECRET=/nt7HnESznSaQryn8QMx3gpgbsQMB8J1CkHXBCDj7A+IaBqEqEs6utgpjfVzeISAEbzREK7ASFwN7UJOvBcoAA==

### Email Configuration
RESEND_API_KEY=re_5ozt5Yoj_8PreYRoYXUnWfREZnqFXNXeJ
EMAIL_FROM=Admin@axixfinance.com
EMAIL_FROM_NAME=AxixFinance

### Application URLs
CLIENT_URL=https://axix-finance-mtgf.vercel.app
SITE_URL=https://axix-finance-mtgf.vercel.app
FRONTEND_URL=https://axix-finance-mtgf.vercel.app
CONTACT_EMAIL=support@axix-finance.com

## TROUBLESHOOTING STEPS:

1. **Add one variable at a time** - Don't try to add all at once
2. **Select environments**: Check "Production", "Preview", and "Development" 
3. **No quotes needed**: Don't wrap values in quotes in Vercel UI
4. **Special characters**: If a value has special characters, just paste it directly
5. **Save after each**: Click "Save" after adding each variable
6. **Redeploy**: After adding variables, trigger a new deployment
