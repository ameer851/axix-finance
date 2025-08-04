# Axix Finance Deployment Checklist

## Pre-Deployment
- [x] Update vercel.json with proper CORS headers
- [x] Fix client Supabase configuration
- [x] Create production environment file

## Vercel Environment Variables
Ensure these variables are set in your Vercel project:

- `NODE_ENV`: production
- `SUPABASE_URL`: https://wvnyiinrmfysabsfztii.supabase.co
- `SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k
- `SUPABASE_SERVICE_ROLE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDM2NywiZXhwIjoyMDY4NjcwMzY3fQ.zLhFm0aPCDfbUQHWWdPJeRfXaI06JP1sHzfGdHM0n9g
- `VITE_SUPABASE_URL`: https://wvnyiinrmfysabsfztii.supabase.co
- `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k
- `CORS_ORIGIN`: https://www.axixfinance.com,https://axixfinance.com,https://axix-finance.vercel.app

## Post-Deployment Verification
- [ ] Test admin login at https://www.axixfinance.com
- [ ] Verify CORS errors are resolved
- [ ] Check for any remaining API key errors

## Troubleshooting
If issues persist:
1. Clear browser cache and cookies
2. Try accessing the site in incognito/private mode
3. Check browser console for specific errors
4. Verify environment variables in Vercel Dashboard
