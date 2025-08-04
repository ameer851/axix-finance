#!/usr/bin/env node

/**
 * Comprehensive Deployment Fix Script
 * This script updates all necessary components to fix authentication and CORS issues
 */

import fs from "fs";
import path from "path";

// Display banner
console.log("=".repeat(80));
console.log("  AXIX FINANCE - DEPLOYMENT FIX SCRIPT");
console.log("  Fixes authentication and CORS issues in production");
console.log("=".repeat(80));
console.log("");

// 1. Update vercel.json with proper CORS configuration
const vercelConfig = {
  version: 2,
  buildCommand: "npm run build",
  installCommand: "npm install --legacy-peer-deps",
  outputDirectory: "client/dist",
  framework: "vite",
  functions: {
    "api/*.ts": {
      runtime: "@vercel/node@2.15.10",
      memory: 1024,
    },
  },
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
        },
        {
          key: "Access-Control-Allow-Headers",
          value:
            "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
        },
      ],
    },
  ],
  rewrites: [
    { source: "/api/(.*)", destination: "/api/$1" },
    { source: "/(.*)", destination: "/client/dist/$1" },
  ],
};

// Write updated vercel.json file
fs.writeFileSync(
  path.join(process.cwd(), "vercel.json"),
  JSON.stringify(vercelConfig, null, 2)
);
console.log("✅ Updated vercel.json with proper CORS configuration");

// 2. Create a production environment file
const productionEnv = `# Production Environment for Axix Finance
# Generated on ${new Date().toISOString()}

# Node Environment
NODE_ENV=production

# Database Connection
DATABASE_URL=postgresql://postgres.wvnyiinrmfysabsfztii:iOsIwZAOpNz0CN4B@aws-0-us-east-2.pooler.supabase.com:6543/postgres

# CORS Configuration
CORS_ORIGIN=https://www.axixfinance.com,https://axixfinance.com,https://axix-finance.vercel.app

# Supabase Configuration
SUPABASE_URL=https://wvnyiinrmfysabsfztii.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDM2NywiZXhwIjoyMDY4NjcwMzY3fQ.zLhFm0aPCDfbUQHWWdPJeRfXaI06JP1sHzfGdHM0n9g

# Vite Environment Variables (for frontend)
VITE_SUPABASE_URL=https://wvnyiinrmfysabsfztii.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k
VITE_FRONTEND_URL=https://www.axixfinance.com
VITE_API_URL=https://www.axixfinance.com

# Authentication
SESSION_SECRET=z+7MUZsDoFDg7f7g9/grQ4zEsn+fpUTFj1L7lfhyxrMJ4RET7LUiUQFUmC2YdjRRXkbXCSLjqFm2THvRwKlBpfNrmLA==
JWT_SECRET=TQzqPABJNY5aQNe3/1F5jLgOxwmI/wQZrFEJpFPp8vUIaBqEqEs6utgpjfVzeISAEbzREk7ASFwN7UJOvBcoAA==

# Application URLs
CLIENT_URL=https://www.axixfinance.com
SITE_URL=https://www.axixfinance.com
FRONTEND_URL=https://www.axixfinance.com

# Email Configuration
RESEND_API_KEY=re_7EPnqe1x_GbWWRKim85XJjxwAp1cHx2ET
EMAIL_FROM=Admin@axixfinance.com
EMAIL_FROM_NAME=AxixFinance
EMAIL_SERVICE=resend
CONTACT_EMAIL=support@axix-finance.com
`;

// Write the production environment file
fs.writeFileSync(
  path.join(process.cwd(), "vercel-production.env"),
  productionEnv
);
console.log("✅ Created vercel-production.env with all required variables");

// 3. Create an index.html file with supabase config
const supabaseHtmlConfig = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Axix Finance</title>
  <!-- Supabase configuration - override environment variables -->
  <script>
    window.SUPABASE_CONFIG = {
      supabaseUrl: "https://wvnyiinrmfysabsfztii.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k"
    };
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;

// Check if the client/index.html file exists
const clientIndexPath = path.join(process.cwd(), "client", "index.html");
const backupPath = path.join(process.cwd(), "client", "index.html.backup");

if (fs.existsSync(clientIndexPath)) {
  // Backup the original file
  fs.copyFileSync(clientIndexPath, backupPath);
  console.log("✅ Backed up original client/index.html");

  // Write the new index.html with supabase config
  fs.writeFileSync(clientIndexPath, supabaseHtmlConfig);
  console.log("✅ Updated client/index.html with hardcoded Supabase config");
}

// 4. Create a deployment checklist
const deploymentChecklist = `# Axix Finance Deployment Checklist

## Pre-Deployment
- [x] Update vercel.json with proper CORS headers
- [x] Fix client Supabase configuration
- [x] Create production environment file

## Vercel Environment Variables
Ensure these variables are set in your Vercel project:

- \`NODE_ENV\`: production
- \`SUPABASE_URL\`: https://wvnyiinrmfysabsfztii.supabase.co
- \`SUPABASE_ANON_KEY\`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k
- \`SUPABASE_SERVICE_ROLE_KEY\`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDM2NywiZXhwIjoyMDY4NjcwMzY3fQ.zLhFm0aPCDfbUQHWWdPJeRfXaI06JP1sHzfGdHM0n9g
- \`VITE_SUPABASE_URL\`: https://wvnyiinrmfysabsfztii.supabase.co
- \`VITE_SUPABASE_ANON_KEY\`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQzNjcsImV4cCI6MjA2ODY3MDM2N30.BF008qPmpqtA4IZVQZE_P52CBoI3lVZQKc_yUg2rN4k
- \`CORS_ORIGIN\`: https://www.axixfinance.com,https://axixfinance.com,https://axix-finance.vercel.app

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
`;

// Write the deployment checklist
fs.writeFileSync(
  path.join(process.cwd(), "DEPLOYMENT-CHECKLIST-UPDATED.md"),
  deploymentChecklist
);
console.log("✅ Created DEPLOYMENT-CHECKLIST-UPDATED.md");

console.log("\n" + "=".repeat(80));
console.log("  DEPLOYMENT INSTRUCTIONS");
console.log("=".repeat(80));

console.log(`
1. Commit all these changes to your repository
2. Deploy to Vercel with the following settings:
   - Environment Variables: Use vercel-production.env
   - Build Command: npm run build
   - Output Directory: client/dist
   - Install Command: npm install --legacy-peer-deps

3. After deployment:
   - Check for CORS errors in browser console
   - Try to log in with admin credentials
   - If issues persist, contact support

For quick deployment via CLI:
$ vercel --prod
`);

console.log("=".repeat(80));
