#!/usr/bin/env node

/**
 * Fix Vercel Deployment Configuration
 *
 * This script updates your Vercel configuration to fix the common issues with
 * CORS, Supabase authentication, and environment variables.
 */

import fs from "fs";
import path from "path";

// Update the vercel.json file with correct configuration
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
      source: "/api/(.*)",
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
            "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
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

console.log("✅ Updated vercel.json with correct CORS and API configuration");

// Create a production environment validation script
const validationScript = `#!/usr/bin/env node

/**
 * Production Environment Validation
 * 
 * This script validates that all required environment variables are set
 * correctly for the production environment.
 */

function checkEnvironmentVariables() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(\`  - \${varName}\`));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
  
  // Validate Supabase URL and keys format
  if (!process.env.SUPABASE_URL.includes('supabase.co')) {
    console.error('❌ SUPABASE_URL does not look valid');
    process.exit(1);
  }
  
  if (!process.env.SUPABASE_ANON_KEY.startsWith('eyJ')) {
    console.error('❌ SUPABASE_ANON_KEY does not look valid');
    process.exit(1);
  }
  
  console.log('✅ Supabase configuration appears valid');
}

checkEnvironmentVariables();
`;

// Write the validation script
fs.writeFileSync(
  path.join(process.cwd(), "validate-production-env.js"),
  validationScript
);

console.log(
  "✅ Created validation script to verify production environment variables"
);
console.log("");
console.log("DEPLOYMENT INSTRUCTIONS:");
console.log("1. Commit these changes to your repository");
console.log("2. Update your Vercel environment variables:");
console.log(
  "   - Ensure CORS_ORIGIN is set to: https://www.axixfinance.com,https://axixfinance.com"
);
console.log("   - Update VITE_FRONTEND_URL to: https://www.axixfinance.com");
console.log("   - Update VITE_API_URL to: https://www.axixfinance.com");
console.log("   - Verify all Supabase keys are correct");
console.log("3. Redeploy your application");
console.log(
  "4. After deployment, check /api/debug/env to verify environment variables"
);
console.log(
  "   (only available in development or if NODE_ENV is not 'production')"
);
console.log("");
console.log(
  "If issues persist, try setting VITE_* variables in both Vercel's Environment Variables"
);
console.log(
  "and directly in the Build & Development Settings > Environment Variables section."
);
